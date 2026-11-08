import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { askToTeamUp } from "@/lib/nearby";
import { buildToday } from "@/lib/state";

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { userId } = await readBody(request);
  if (typeof userId !== "string" || !/^[0-9a-f-]{36}$/.test(userId)) throw new HttpError(400, "bad_person", "Please pick someone.");
  await askToTeamUp(user, userId);
  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
