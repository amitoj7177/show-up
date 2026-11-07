import { requireUser } from "@/lib/auth";
import { isAvatarCode } from "@/lib/avatar";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { buildToday } from "@/lib/state";

// Change your character or check-in time, or turn on gentle mode, where it never gets angry.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { gentleMascot, checkInTime, avatar } = await readBody(request);

  if (avatar !== undefined) {
    if (!isAvatarCode(avatar)) throw new HttpError(400, "bad_avatar", "We couldn't save that character.");
    await query("UPDATE users SET avatar = $2 WHERE id = $1", [user.id, avatar]);
  }
  if (gentleMascot !== undefined) {
    if (typeof gentleMascot !== "boolean") throw new HttpError(400, "bad_setting", "That setting isn't valid.");
    await query("UPDATE users SET gentle_mascot = $2 WHERE id = $1", [user.id, gentleMascot]);
  }
  if (checkInTime !== undefined) {
    if (typeof checkInTime !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(checkInTime)) {
      throw new HttpError(400, "bad_time", "Please pick a check-in time.");
    }
    await query("UPDATE users SET check_in_time = $2 WHERE id = $1", [user.id, checkInTime]);
  }

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
