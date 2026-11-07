import { profileComplete, startSession, type AccountRow } from "@/lib/auth";
import { checkPassword } from "@/lib/auth0";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";

// Log in on any device.
export const POST = route(async (request) => {
  const { email, password } = await readBody(request);
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new HttpError(400, "bad_login", "Enter your email and password.");
  }

  const authId = await checkPassword(email, password);
  const [account] = await query<AccountRow>(
    `INSERT INTO accounts (auth_id, avatar) VALUES ($1, $2)
     ON CONFLICT (auth_id) DO UPDATE SET auth_id = EXCLUDED.auth_id RETURNING *`,
    [authId, DEFAULT_AVATAR],
  );
  return ok({ token: await startSession(account.id), avatar: account.avatar, hasPromise: Boolean(account.user_id), profileComplete: profileComplete(account) });
});
