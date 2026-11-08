import { query, type PairRow, type UserRow } from "./db";
import { HttpError } from "./http";
import { findCommunity } from "./calgary";
import { tryMatch } from "./matching";
import { nearbyFor } from "./nearby";
import { parseAvatar } from "./avatar";
import {
  addDays,
  moveTag,
  checkinPoints,
  EXTRA_UNLOCKS,
  extraLocked,
  canOfferNewMatch,
  daysBetween,
  GOAL_TYPE_LABELS,
  mascotFor,
  MESSAGES,
  minutesPast,
  NOT_MEDICAL_CARE,
  partnerMood,
  sharedStreak,
  silentDays,
  summaryDue,
  SUPPORT_LINKS,
  todayIn,
  weekStrip,
  type CheckinStatus,
  type DayCheckins,
  type GoalType,
} from "./rules";

// Proof for one check-in: the photo's id, what Gemini saw in it, and when the partner confirmed it.
function proofOf(
  row: { id: string; has_photo: boolean; photo_note: string | null; confirmed_at: Date | null; fitbit_steps: number | null; fitbit_workout: string | null; fitbit_active_minutes: number | null } | undefined,
) {
  if (!row) return null;
  return {
    fitbitSteps: row.fitbit_steps,
    fitbitWorkout: row.fitbit_workout,
    fitbitActiveMinutes: row.fitbit_active_minutes,
    photoId: row.has_photo ? row.id : null,
    note: row.photo_note,
    confirmedAt: row.confirmed_at ? new Date(row.confirmed_at).toISOString() : null,
  };
}

// Someone counts as "active now" if they opened the app in the last few minutes.
const ACTIVE_NOW_MS = 3 * 60_000;

export async function findActivePair(userId: string): Promise<PairRow | undefined> {
  const [pair] = await query<PairRow>(
    "SELECT * FROM pairs WHERE ended_at IS NULL AND (user_a = $1 OR user_b = $1) LIMIT 1",
    [userId],
  );
  return pair;
}

export async function requirePair(user: UserRow): Promise<PairRow> {
  const pair = await findActivePair(user.id);
  if (!pair) throw new HttpError(409, "no_partner", "You don't have a partner right now.");
  return pair;
}

export async function requireDemoPair(user: UserRow): Promise<PairRow> {
  const pair = await requirePair(user);
  if (!pair.is_demo) throw new HttpError(403, "not_demo", "This only works in demo mode.");
  return pair;
}

export function partnerIdOf(pair: PairRow, userId: string): string {
  return pair.user_a === userId ? pair.user_b : pair.user_a;
}

export function pairToday(pair: PairRow, now = new Date()): string {
  return todayIn(now, pair.day_offset);
}

async function checkinsFor(pairId: string): Promise<Record<string, DayCheckins>> {
  const rows = await query<{ user_id: string; day: string; status: CheckinStatus }>(
    "SELECT user_id, day, status FROM checkins WHERE pair_id = $1",
    [pairId],
  );
  const byUser: Record<string, DayCheckins> = {};
  for (const row of rows) (byUser[row.user_id] ??= {})[row.day] = row.status;
  return byUser;
}

type Profile = { id: string; first_name: string | null; community: string | null; moves: string | null; has_photo: boolean };

// The real-person side of someone: first name, photo and Calgary community. Demo users have none.
async function profileOf(userId: string): Promise<Profile | undefined> {
  const [profile] = await query<Profile>(
    "SELECT id, first_name, community, moves, photo IS NOT NULL AS has_photo FROM accounts WHERE user_id = $1",
    [userId],
  );
  return profile;
}

function describeProfile(profile: Profile | undefined) {
  return {
    firstName: profile?.first_name ?? null,
    photoId: profile?.has_photo ? profile.id : null,
    communityName: findCommunity(profile?.community)?.name ?? null,
    moveTag: moveTag(profile?.moves),
    area: findCommunity(profile?.community)?.area ?? null,
  };
}

// Points for every check-in on this promise.
export async function pointsFor(userId: string): Promise<number> {
  const rows = await query<{
    status: string;
    confirmed: boolean;
    fitbit_steps: number | null;
    fitbit_workout: string | null;
    fitbit_active_minutes: number | null;
  }>(
    "SELECT status, confirmed_at IS NOT NULL AS confirmed, fitbit_steps, fitbit_workout, fitbit_active_minutes FROM checkins WHERE user_id = $1",
    [userId],
  );
  return rows.reduce((sum, row) => sum + checkinPoints({ status: row.status, confirmed: row.confirmed, fitbitSteps: row.fitbit_steps, fitbitWorkout: row.fitbit_workout, fitbitActiveMinutes: row.fitbit_active_minutes }), 0);
}

// Stops someone saving an extra they haven't earned yet. An extra they already wear is fine.
export async function requireUnlocked(code: string, currentCode: string, userId: string | null): Promise<void> {
  const extra = parseAvatar(code).acc;
  if (extra === parseAvatar(currentCode).acc) return;
  const points = userId ? await pointsFor(userId) : 0;
  if (extraLocked(extra, points)) throw new HttpError(403, "locked", `That extra unlocks at ${EXTRA_UNLOCKS[extra]} points.`);
}

function describeMe(user: UserRow & { group_name?: string | null }, profile: Profile | undefined, points: number) {
  return {
    points,
    group: user.group_name ?? null,
    ...describeProfile(profile),
    whyItMatters: user.why_it_matters,
    nickname: profile?.first_name ?? user.nickname,
    avatar: user.avatar,
    goal: {
      text: user.goal_text,
      partnerSees: user.short_goal,
      type: user.goal_type,
      typeLabel: GOAL_TYPE_LABELS[user.goal_type as GoalType],
    },
    checkInTime: user.check_in_time,
    gentleMascot: user.gentle_mascot,
    why: user.why,
  };
}

// Everything the main screen needs, in one response. Screens ask for this every 3 seconds.
export async function buildToday(startingUser: UserRow, now = new Date()) {
  let user: UserRow & { group_name?: string | null } = startingUser;

  // Someone returning after going silent goes back in the line for a partner.
  if (user.status === "inactive") {
    await query("UPDATE users SET status = 'waiting', waiting_since = now() WHERE id = $1", [user.id]);
  }
  if (user.status === "inactive" || user.status === "waiting") {
    await tryMatch(user.id);
    [user] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  }
  if (user.group_id) {
    const [group] = await query<{ name: string }>("SELECT name FROM groups WHERE id = $1", [user.group_id]);
    user = { ...user, group_name: group?.name ?? null };
  }

  const pair = user.status === "paired" ? await findActivePair(user.id) : undefined;
  const myProfile = await profileOf(user.id);

  if (!pair) {
    return {
      status: user.status === "left" ? ("left" as const) : ("waiting" as const),
      isDemo: user.is_demo,
      me: describeMe(user, myProfile, await pointsFor(user.id)),
      today: { date: todayIn(now), myCheckin: null, canCheckIn: false },
      partner: null,
      pair: null,
      mascot: {
        mood: "waiting" as const,
        angerLevel: 0 as const,
        message: "Finding your partner now.",
        screenReaderText: "The mascot looks waiting. Finding your partner now.",
      },
      messagesReceived: [],
      canSendMessage: false,
      notice: user.notice,
      // Real people choose a partner on the Nearby board.
      nearby: myProfile && user.status === "waiting" ? await nearbyFor(user) : null,
      support: SUPPORT_LINKS,
      notMedicalCare: NOT_MEDICAL_CARE,
    };
  }

  const partnerId = partnerIdOf(pair, user.id);
  const [partner] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [partnerId]);
  const partnerProfile = await profileOf(partnerId);
  const today = pairToday(pair, now);
  const checkins = await checkinsFor(pair.id);
  const mine = checkins[user.id] ?? {};
  const theirs = checkins[partnerId] ?? {};
  const streak = sharedStreak(mine, theirs, pair.started_on, today);
  const dayNumber = daysBetween(pair.started_on, today) + 1;

  // Real signs of a real person: when they last opened the app, when they checked in, and whether they saw yours.
  const todayRows = await query<{
    id: string;
    user_id: string;
    created_at: Date;
    seen_at: Date | null;
    has_photo: boolean;
    photo_note: string | null;
    confirmed_at: Date | null;
    fitbit_steps: number | null;
    fitbit_workout: string | null;
    fitbit_active_minutes: number | null;
  }>(
    `SELECT id, user_id, created_at, seen_at, photo IS NOT NULL AS has_photo, photo_note, confirmed_at, fitbit_steps, fitbit_workout,
            fitbit_active_minutes
       FROM checkins WHERE pair_id = $1 AND day = $2`,
    [pair.id, today],
  );
  const theirRow = todayRows.find((row) => row.user_id === partnerId);
  const myRow = todayRows.find((row) => row.user_id === user.id);
  if (theirRow && !theirRow.seen_at) {
    await query("UPDATE checkins SET seen_at = now() WHERE pair_id = $1 AND user_id = $2 AND day = $3 AND seen_at IS NULL", [
      pair.id,
      partnerId,
      today,
    ]);
  }

  const sentToday = await query<{ from_user: string; message_id: string; created_at: Date }>(
    "SELECT from_user, message_id, created_at FROM encouragements WHERE pair_id = $1 AND day = $2",
    [pair.id, today],
  );

  return {
    status: "paired" as const,
    isDemo: pair.is_demo,
    me: describeMe(user, myProfile, await pointsFor(user.id)),
    today: {
      date: today,
      myCheckin: mine[today] ?? null,
      canCheckIn: true,
      seenByPartnerAt: myRow?.seen_at ? new Date(myRow.seen_at).toISOString() : null,
      proof: proofOf(myRow),
    },
    partner: {
      ...describeProfile(partnerProfile),
      nickname: partnerProfile?.first_name ?? partner.nickname,
      whyItMatters: partner.why_it_matters,
      proof: proofOf(theirRow),
      avatar: partner.avatar,
      mood: partnerMood(theirs[today] ?? null),
      goal: partner.short_goal,
      goalType: partner.goal_type,
      goalTypeLabel: GOAL_TYPE_LABELS[partner.goal_type as GoalType],
      checkinToday: theirs[today] ?? null,
      overdue: !theirs[today] && today !== pair.started_on && minutesPast(partner.check_in_time, now) >= 0,
      silentDays: silentDays(theirs, pair.started_on, today),
      activeNow: now.getTime() - new Date(partner.last_seen).getTime() < ACTIVE_NOW_MS,
      lastActiveAt: new Date(partner.last_seen).toISOString(),
      checkedInAt: theirRow ? new Date(theirRow.created_at).toISOString() : null,
    },
    pair: {
      startedOn: pair.started_on,
      dayNumber,
      dayOfWeek: ((dayNumber - 1) % 7) + 1,
      daysLeftThisWeek: 7 - (((dayNumber - 1) % 7) + 1),
      streak,
      week: weekStrip(mine, theirs, pair.started_on, today),
      canOfferNewMatch: canOfferNewMatch(theirs, pair.started_on, today),
      summaryDue: summaryDue(pair.started_on, today),
    },
    mascot: mascotFor({
      myStatusToday: mine[today],
      mySilentDays: silentDays(mine, pair.started_on, today),
      // Nobody gets told off on the day they join, even if their check-in time has passed.
      minutesPastCheckIn: today === pair.started_on ? -1 : minutesPast(user.check_in_time, now),
      partnerCheckedInToday: Boolean(theirs[today]),
      streak,
      gentle: user.gentle_mascot,
    }),
    messagesReceived: sentToday
      .filter((row) => row.from_user === partnerId)
      .map((row) => ({
        id: row.message_id,
        text: MESSAGES.find((message) => message.id === row.message_id)?.text ?? "",
        sentAt: row.created_at,
      })),
    canSendMessage: !sentToday.some((row) => row.from_user === user.id),
    notice: user.notice,
    support: SUPPORT_LINKS,
    notMedicalCare: NOT_MEDICAL_CARE,
  };
}

// An honest count of the last 7 finished days, for both partners.
export async function buildSummary(user: UserRow) {
  const pair = await requirePair(user);
  const partnerId = partnerIdOf(pair, user.id);
  const today = pairToday(pair);
  const checkins = await checkinsFor(pair.id);

  const countFor = (days: DayCheckins) => {
    const counts = { done: 0, rough: 0, silent: 0 };
    for (let back = 1; back <= 7; back += 1) {
      const day = addDays(today, -back);
      if (day < pair.started_on) break;
      const status = days[day];
      if (status) counts[status] += 1;
      else if (day !== pair.started_on) counts.silent += 1; // the match day never counts against you
    }
    return counts;
  };

  return {
    from: addDays(today, -7) < pair.started_on ? pair.started_on : addDays(today, -7),
    to: addDays(today, -1),
    streak: sharedStreak(checkins[user.id] ?? {}, checkins[partnerId] ?? {}, pair.started_on, today),
    me: countFor(checkins[user.id] ?? {}),
    partner: countFor(checkins[partnerId] ?? {}),
  };
}

// Ends the partnership and sends the other person back to look for someone new.
export async function endPair(
  pair: PairRow,
  endedBy: string,
  options: { reason: "left" | "reported" | "new_match"; myNextStatus: "waiting" | "left"; partnerNextStatus: "waiting" | "inactive" },
): Promise<void> {
  const partnerId = partnerIdOf(pair, endedBy);
  await query("UPDATE pairs SET ended_at = now(), end_reason = $2 WHERE id = $1", [pair.id, options.reason]);
  await query("UPDATE users SET status = $2, waiting_since = now(), notice = NULL WHERE id = $1", [
    endedBy,
    options.myNextStatus,
  ]);
  await query("UPDATE users SET status = $2, waiting_since = now(), notice = $3 WHERE id = $1", [
    partnerId,
    options.partnerNextStatus,
    "Your partner moved on. We're finding you someone new.",
  ]);
}
