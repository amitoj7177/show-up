import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { buildToday, endPair, findActivePair } from "@/lib/state";

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const pair = await findActivePair(user.id);

  if (pair) {
    await endPair(pair, user.id, { reason: "left", myNextStatus: "left", partnerNextStatus: "waiting" });
  } else {
    await query("UPDATE users SET status = 'left' WHERE id = $1", [user.id]);
  }

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
