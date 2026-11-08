import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { HttpError, ok, route } from "@/lib/http";
import { buildToday, pairToday, partnerIdOf, requirePair } from "@/lib/state";

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const pair = await requirePair(user);
  const confirmed = await query(
    `UPDATE checkins SET confirmed_at = now()
      WHERE pair_id = $1 AND user_id = $2 AND day = $3 AND status = 'done' AND confirmed_at IS NULL
      RETURNING id`,
    [pair.id, partnerIdOf(pair, user.id), pairToday(pair)],
  );
  if (confirmed.length === 0) throw new HttpError(409, "nothing_to_confirm", "There's no check-in to confirm right now.");
  return ok(await buildToday(user));
});
