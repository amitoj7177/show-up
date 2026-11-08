import { startSession, type AccountRow } from "@/lib/auth";
import { checkPassword, createAuth0User } from "@/lib/auth0";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { PASSWORD_RULE, strongEnough } from "@/lib/rules";

export const POST = route(async (request) => {
  const { email, password } = await readBody(request);
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(400, "bad_email", "Enter a valid email.");
  }
  if (typeof password !== "string" || !strongEnough(password)) {
    throw new HttpError(400, "bad_password", PASSWORD_RULE);
  }

  await createAuth0User(email, password);
  const authId = await checkPassword(email, password);
  const [account] = await query<AccountRow>(
    `INSERT INTO accounts (auth_id, avatar) VALUES ($1, $2)
     ON CONFLICT (auth_id) DO UPDATE SET auth_id = EXCLUDED.auth_id RETURNING *`,
    [authId, DEFAULT_AVATAR],
  );
  return ok({ token: await startSession(account.id), avatar: account.avatar, hasPromise: false, profileComplete: false }, "live", 201);
});
