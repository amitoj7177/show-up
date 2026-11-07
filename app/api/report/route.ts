import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { REPORT_REASONS } from "@/lib/rules";
import { buildToday, endPair, requirePair } from "@/lib/state";

// Report your partner. The pairing ends straight away, and you never get matched again.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { reason } = await readBody(request);
  if (!REPORT_REASONS.some((option) => option.id === reason)) {
    throw new HttpError(400, "bad_reason", "Please choose a reason.");
  }

  const pair = await requirePair(user);
  await query("INSERT INTO reports (pair_id, reporter, reason) VALUES ($1, $2, $3)", [pair.id, user.id, reason]);
  await endPair(pair, user.id, { reason: "reported", myNextStatus: "waiting", partnerNextStatus: "waiting" });

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
