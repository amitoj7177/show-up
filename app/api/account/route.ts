import { requireAccount } from "@/lib/auth";
import { isAvatarCode } from "@/lib/avatar";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";

// Your saved character, and whether you already have a promise.
export const GET = route(async (request) => {
  const account = await requireAccount(request);
  return ok({ avatar: account.avatar, hasPromise: Boolean(account.user_id) });
});

// Save your character during sign-up, before you've made a promise.
export const POST = route(async (request) => {
  const account = await requireAccount(request);
  const { avatar } = await readBody(request);
  if (!isAvatarCode(avatar)) throw new HttpError(400, "bad_avatar", "We couldn't save that character.");
  await query("UPDATE accounts SET avatar = $2 WHERE id = $1", [account.id, avatar]);
  return ok({ avatar, hasPromise: Boolean(account.user_id) });
});
