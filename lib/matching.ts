import { hashToken, newToken } from "./auth";
import { randomAvatar } from "./avatar";
import { query, transaction, type UserRow } from "./db";
import { makeNickname, MATCH_ANY_TYPE_AFTER_SECONDS, todayIn } from "./rules";

// A labelled sample partner, so the demo never depends on anyone else joining.
export async function pairWithDemoPartner(user: UserRow): Promise<void> {
  const [partner] = await query<UserRow>(
    `INSERT INTO users (token_hash, nickname, goal_text, short_goal, goal_type, check_in_time, why, status, is_demo, avatar)
     VALUES ($1, $2, 'Sample goal', 'Take a 10-minute walk', $3, '09:00', '{}', 'paired', true, $4) RETURNING *`,
    [hashToken(newToken()), `Demo ${makeNickname()}`, user.goal_type, randomAvatar()],
  );
  await query("INSERT INTO pairs (user_a, user_b, started_on, is_demo) VALUES ($1, $2, $3, true)", [
    user.id,
    partner.id,
    todayIn(new Date()),
  ]);
  await query("UPDATE users SET status = 'paired', notice = NULL WHERE id = $1", [user.id]);
}

// Pairs a waiting person with someone else who is waiting.
// The longest-waiting person with the same goal type goes first.
// After 30 seconds of waiting, any goal type is fine, so nobody waits forever.
// People with a clinic code are only paired with others from the same clinic.
// Someone in the same part of Calgary comes first, so partners can meet up.
export async function tryMatch(userId: string): Promise<void> {
  await transaction(async (client) => {
    const { rows: me } = await client.query<UserRow & { waited_seconds: number }>(
      `SELECT *, EXTRACT(EPOCH FROM now() - waiting_since)::float AS waited_seconds
         FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (me[0]?.status !== "waiting" || me[0].is_demo) return;

    // SKIP LOCKED: if two people match at the same moment, nobody gets paired twice.
    // The NOT EXISTS part means you never get the same partner again.
    const { rows: found } = await client.query<UserRow>(
      `SELECT c.* FROM users c
        WHERE c.status = 'waiting'
          AND c.id <> $1
          AND c.is_demo = false
          AND c.last_seen > now() - interval '3 days'
          AND c.group_id IS NOT DISTINCT FROM $5
          AND (c.goal_type = $2
               OR $3::float >= $4
               OR c.waiting_since < now() - make_interval(secs => $4))
          AND NOT EXISTS (
            SELECT 1 FROM pairs p
             WHERE (p.user_a = $1 AND p.user_b = c.id) OR (p.user_a = c.id AND p.user_b = $1))
        ORDER BY (c.area IS NOT DISTINCT FROM $6) DESC, (c.goal_type = $2) DESC, c.waiting_since ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED`,
      [userId, me[0].goal_type, me[0].waited_seconds, MATCH_ANY_TYPE_AFTER_SECONDS, me[0].group_id, me[0].area],
    );
    if (!found[0]) return;

    await client.query("INSERT INTO pairs (user_a, user_b, started_on) VALUES ($1, $2, $3)", [
      userId,
      found[0].id,
      todayIn(new Date()),
    ]);
    await client.query("UPDATE users SET status = 'paired', notice = NULL WHERE id = ANY($1::uuid[])", [
      [userId, found[0].id],
    ]);
  });
}
