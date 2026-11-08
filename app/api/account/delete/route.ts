import { requireAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { endPair, findActivePair } from "@/lib/state";

// "Delete my account and data". Removes everything we hold about you.
// Your partner is matched with someone new. Old check-ins stay only as empty marks in their history,
// with your photos, goal and words removed, so their streak history still adds up.
export const POST = route(async (request) => {
  const account = await requireAccount(request);

  if (account.user_id) {
    const pair = await findActivePair(account.user_id);
    if (pair) await endPair(pair, account.user_id, { reason: "left", myNextStatus: "left", partnerNextStatus: "waiting" });
  }

  // Every promise this account made.
  const [{ ids }] = await query<{ ids: string[] }>(
    `SELECT coalesce(array_agg(DISTINCT u.id), '{}') AS ids FROM users u
      WHERE u.id = $1 OR u.id IN (SELECT user_id FROM accounts WHERE id = $2)`,
    [account.user_id, account.id],
  );
  if (ids.length) {
    await query("UPDATE checkins SET photo = NULL, photo_note = NULL, fitbit_steps = NULL, fitbit_workout = NULL WHERE user_id = ANY($1::uuid[])", [ids]);
    await query("DELETE FROM encouragements WHERE from_user = ANY($1::uuid[])", [ids]);
    await query(
      `UPDATE users SET goal_text = '', short_goal = NULL, why_it_matters = NULL, why = '{}', nickname = 'Deleted account',
              avatar = 'h0-c0-s1-e0-o1-k0-a0', status = 'left', area = NULL, group_id = NULL, token_hash = md5(random()::text)
        WHERE id = ANY($1::uuid[])`,
      [ids],
    );
  }

  await query("DELETE FROM sessions WHERE account_id = $1", [account.id]);
  await query("DELETE FROM health_links WHERE account_id = $1", [account.id]);
  await query("DELETE FROM health_states WHERE account_id = $1", [account.id]);
  await query("DELETE FROM fitbit_requests WHERE account_id = $1", [account.id]);
  await query("DELETE FROM accounts WHERE id = $1", [account.id]);

  return ok({ deleted: true });
});
