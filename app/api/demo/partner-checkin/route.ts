import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { buildToday, pairToday, partnerIdOf, requireDemoPair } from "@/lib/state";

// Demo only: make the labelled sample partner check in.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { status } = await readBody(request);
  if (status !== "done" && status !== "rough") {
    throw new HttpError(400, "bad_status", "Please choose Done or Rough day.");
  }

  const pair = await requireDemoPair(user);
  await query(
    `INSERT INTO checkins (pair_id, user_id, day, status) VALUES ($1, $2, $3, $4)
     ON CONFLICT (pair_id, user_id, day) DO UPDATE SET status = EXCLUDED.status`,
    [pair.id, partnerIdOf(pair, user.id), pairToday(pair), status],
  );
  return ok(await buildToday(user));
});
