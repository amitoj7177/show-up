import { createHash, randomBytes } from "node:crypto";
import { query, type UserRow } from "./db";
import { HttpError } from "./http";

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenFrom(request: Request): string | undefined {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || undefined;
}

export type AccountRow = {
  id: string;
  auth_id: string;
  avatar: string;
  user_id: string | null;
  first_name: string | null;
  photo: string | null;
  community: string | null;
  adult: boolean;
};

export function profileComplete(account: AccountRow): boolean {
  return Boolean(account.first_name && account.community && account.adult);
}

export async function findAccount(request: Request): Promise<AccountRow | undefined> {
  const token = tokenFrom(request);
  if (!token) return undefined;
  const [account] = await query<AccountRow>(

    `SELECT a.id, a.auth_id, a.avatar, a.user_id, a.first_name, a.community, a.adult, NULL AS photo
       FROM accounts a JOIN sessions s ON s.account_id = a.id WHERE s.token_hash = $1`,
    [hashToken(token)],
  );
  return account;
}

export async function requireAccount(request: Request): Promise<AccountRow> {
  const account = await findAccount(request);
  if (!account) throw new HttpError(401, "not_signed_in", "Please log in to continue.");
  return account;
}

export async function startSession(accountId: string): Promise<string> {
  const token = newToken();
  await query("INSERT INTO sessions (token_hash, account_id) VALUES ($1, $2)", [hashToken(token), accountId]);
  return token;
}

export async function requireUser(request: Request): Promise<UserRow> {
  const token = tokenFrom(request);
  if (!token) throw new HttpError(401, "not_signed_in", "Please log in to continue.");

  const account = await findAccount(request);
  if (account && !account.user_id) throw new HttpError(409, "no_promise", "Make a promise to get started.");

  const [user] = account
    ? await query<UserRow>("SELECT * FROM users WHERE id = $1", [account.user_id])
    : await query<UserRow>("SELECT * FROM users WHERE token_hash = $1", [hashToken(token)]);
  if (!user) throw new HttpError(401, "not_signed_in", "Please log in to continue.");

  await query("UPDATE users SET last_seen = now() WHERE id = $1 AND last_seen < now() - interval '1 minute'", [user.id]);
  return user;
}
