import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { findCommunity } from "./calgary";
import { query, transaction } from "./db";
import { HttpError } from "./http";
import { GOAL_TYPE_LABELS, todayIn, type GoalType } from "./rules";

// The Nearby board. Instead of waiting blind, you see real people near you who are looking right now,
// ask one to team up, and they say yes or not now. Only people who are looking can see each other.

export type NearbyPerson = {
  userId: string;
  firstName: string;
  photoId: string | null;
  avatar: string;
  communityName: string | null;
  km: number | null;
  goal: string;
  goalTypeLabel: string;
  whyItMatters: string | null;
  activeNow: boolean;
  askedByMe: boolean;
};

export type TeamRequest = { requestId: string; from: NearbyPerson };

type Row = {
  id: string;
  first_name: string;
  account_id: string;
  has_photo: boolean;
  avatar: string;
  community: string | null;
  short_goal: string | null;
  goal_text: string;
  goal_type: string;
  why_it_matters: string | null;
  active_now: boolean;
};

const PERSON_COLUMNS = `u.id, a.first_name, a.id AS account_id, a.photo IS NOT NULL AS has_photo, u.avatar, a.community,
  u.short_goal, u.goal_text, u.goal_type, u.why_it_matters, u.last_seen > now() - interval '1 minute' AS active_now`;

// Straight-line distance between two Calgary communities, from the City's open data. Never anyone's exact location.
function distanceKm(codeA: string | null, codeB: string | null): number | null {
  const a = findCommunity(codeA);
  const b = findCommunity(codeB);
  if (!a || !b) return null;
  const rad = Math.PI / 180;
  const x = (b.lng - a.lng) * rad * Math.cos(((a.lat + b.lat) / 2) * rad);
  const y = (b.lat - a.lat) * rad;
  return Math.round(Math.sqrt(x * x + y * y) * 6371 * 10) / 10;
}

function describe(row: Row, myCommunity: string | null, askedByMe = false): NearbyPerson {
  return {
    userId: row.id,
    firstName: row.first_name,
    photoId: row.has_photo ? row.account_id : null,
    avatar: row.avatar,
    communityName: findCommunity(row.community)?.name ?? null,
    km: distanceKm(myCommunity, row.community),
    goal: row.short_goal ?? GOAL_TYPE_LABELS[row.goal_type as GoalType],
    goalTypeLabel: GOAL_TYPE_LABELS[row.goal_type as GoalType],
    whyItMatters: row.why_it_matters,
    activeNow: row.active_now,
    askedByMe,
  };
}

// The people you're allowed to see: looking now, a real profile, same clinic (or none), seen in the last 3 days,
// never your partner before, and they haven't said "not now" to you.
const VISIBLE = `
  FROM users u JOIN accounts a ON a.user_id = u.id
 WHERE u.status = 'waiting' AND u.is_demo = false AND u.id <> $1
   AND a.first_name IS NOT NULL
   AND u.last_seen > now() - interval '3 days'
   AND u.group_id IS NOT DISTINCT FROM $2
   AND NOT EXISTS (SELECT 1 FROM pairs p WHERE (p.user_a = $1 AND p.user_b = u.id) OR (p.user_a = u.id AND p.user_b = $1))
   AND NOT EXISTS (SELECT 1 FROM team_requests r WHERE r.from_user = $1 AND r.to_user = u.id AND r.accepted = false)`;

// People who asked you show at the top as a request, not again in the list.
const NOT_ASKED_ME = `AND NOT EXISTS (SELECT 1 FROM team_requests r WHERE r.from_user = u.id AND r.to_user = $1 AND r.answered_at IS NULL)`;

async function myCommunity(userId: string): Promise<string | null> {
  const [row] = await query<{ community: string | null }>("SELECT community FROM accounts WHERE user_id = $1", [userId]);
  return row?.community ?? null;
}

// Everyone near you who is looking. Closest first, then the same kind of goal.
export async function nearbyFor(user: { id: string; group_id: string | null; goal_type: string }): Promise<{ people: NearbyPerson[]; requests: TeamRequest[] }> {
  const community = await myCommunity(user.id);
  const rows = await query<Row & { asked: boolean }>(
    `SELECT ${PERSON_COLUMNS},
            EXISTS (SELECT 1 FROM team_requests r WHERE r.from_user = $1 AND r.to_user = u.id AND r.answered_at IS NULL) AS asked
     ${VISIBLE} ${NOT_ASKED_ME}
     ORDER BY u.waiting_since DESC LIMIT 50`,
    [user.id, user.group_id],
  );
  const people = rows
    .map((row) => ({ person: describe(row, community, row.asked), sameType: row.goal_type === user.goal_type }))
    .sort((a, b) => (a.person.km ?? 999) - (b.person.km ?? 999) || Number(b.sameType) - Number(a.sameType))
    .slice(0, 20)
    .map(({ person }) => person);

  const asks = await query<Row & { request_id: string }>(
    `SELECT r.id AS request_id, ${PERSON_COLUMNS}
       FROM team_requests r JOIN users u ON u.id = r.from_user JOIN accounts a ON a.user_id = u.id
      WHERE r.to_user = $1 AND r.answered_at IS NULL AND u.status = 'waiting'
      ORDER BY r.created_at`,
    [user.id],
  );
  return { people, requests: asks.map((row) => ({ requestId: row.request_id, from: describe(row, community) })) };
}

// Whether you can see someone's profile photo on the board.
export async function canSeeOnBoard(viewer: { id: string; group_id: string | null }, ownerUserId: string): Promise<boolean> {
  const [visible] = await query(`SELECT 1 ${VISIBLE} AND u.id = $3`, [viewer.id, viewer.group_id, ownerUserId]);
  if (visible) return true;
  const [asked] = await query("SELECT 1 FROM team_requests WHERE from_user = $2 AND to_user = $1 AND answered_at IS NULL", [viewer.id, ownerUserId]);
  return Boolean(asked);
}

// "Ask to team up".
export async function askToTeamUp(user: { id: string; group_id: string | null; status: string }, toUserId: string): Promise<void> {
  if (user.status !== "waiting") throw new HttpError(409, "not_looking", "You already have a partner.");
  const [visible] = await query(`SELECT 1 ${VISIBLE} AND u.id = $3`, [user.id, user.group_id, toUserId]);
  if (!visible) throw new HttpError(404, "gone", "That person isn't looking any more.");
  // If they already asked you, saying "team up" back is a yes.
  const [theirAsk] = await query<{ id: string }>("SELECT id FROM team_requests WHERE from_user = $1 AND to_user = $2 AND answered_at IS NULL", [toUserId, user.id]);
  if (theirAsk) return answerRequest(user.id, theirAsk.id, true);
  await query(
    `INSERT INTO team_requests (from_user, to_user) SELECT $1, $2
      WHERE NOT EXISTS (SELECT 1 FROM team_requests WHERE from_user = $1 AND to_user = $2 AND answered_at IS NULL)`,
    [user.id, toUserId],
  );
}

// Pairs two people. Used by the board, invites and the automatic matching.
export async function makePair(client: PoolClient, userA: string, userB: string): Promise<void> {
  await client.query("INSERT INTO pairs (user_a, user_b, started_on) VALUES ($1, $2, $3)", [userA, userB, todayIn(new Date())]);
  await client.query("UPDATE users SET status = 'paired', notice = NULL WHERE id = ANY($1::uuid[])", [[userA, userB]]);
  // Any other open asks to or from either person are closed.
  await client.query(
    "UPDATE team_requests SET answered_at = now() WHERE answered_at IS NULL AND (from_user = ANY($1::uuid[]) OR to_user = ANY($1::uuid[]))",
    [[userA, userB]],
  );
}

// "Team up" or "Not now". Saying yes pairs you, if you're both still looking.
export async function answerRequest(userId: string, requestId: string, accept: boolean): Promise<void> {
  await transaction(async (client) => {
    const { rows } = await client.query<{ from_user: string }>(
      "SELECT from_user FROM team_requests WHERE id = $1 AND to_user = $2 AND answered_at IS NULL FOR UPDATE",
      [requestId, userId],
    );
    if (!rows[0]) throw new HttpError(404, "gone", "That request isn't open any more.");
    if (!accept) {
      await client.query("UPDATE team_requests SET answered_at = now(), accepted = false WHERE id = $1", [requestId]);
      return;
    }
    // Lock both people, so nobody ends up in two pairs.
    const { rows: people } = await client.query<{ id: string; status: string }>(
      "SELECT id, status FROM users WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE",
      [[userId, rows[0].from_user]],
    );
    if (people.length !== 2 || people.some((person) => person.status !== "waiting")) {
      await client.query("UPDATE team_requests SET answered_at = now() WHERE id = $1", [requestId]);
      throw new HttpError(409, "gone", "They just found a partner. Try someone else.");
    }
    await client.query("UPDATE team_requests SET answered_at = now(), accepted = true WHERE id = $1", [requestId]);
    await makePair(client, rows[0].from_user, userId);
  });
}

// An invite link for someone you know. Whoever makes a promise through it is paired with you.
export async function inviteCodeFor(userId: string): Promise<string> {
  const [row] = await query<{ invite_code: string | null }>("SELECT invite_code FROM users WHERE id = $1", [userId]);
  if (row?.invite_code) return row.invite_code;
  const code = randomBytes(6).toString("base64url");
  await query("UPDATE users SET invite_code = $2 WHERE id = $1", [userId, code]);
  return code;
}

// Who sent an invite, so the invite page can say "Priya invited you".
export async function inviterName(code: string): Promise<string | null> {
  const [row] = await query<{ first_name: string | null }>(
    "SELECT a.first_name FROM users u JOIN accounts a ON a.user_id = u.id WHERE u.invite_code = $1 AND u.status = 'waiting'",
    [code],
  );
  return row?.first_name ?? null;
}

// The new person made their promise through an invite: pair them with whoever invited them, if still looking.
export async function joinByInvite(newUserId: string, code: string): Promise<boolean> {
  return transaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE invite_code = $1 AND status = 'waiting' AND id <> $2 FOR UPDATE",
      [code, newUserId],
    );
    if (!rows[0]) return false;
    await makePair(client, rows[0].id, newUserId);
    return true;
  });
}
