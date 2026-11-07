import { createHash, randomBytes } from "node:crypto";
import { query, type UserRow } from "./db";
import { HttpError } from "./http";

// There are no logins. Each phone keeps a long random secret (the token).
// We only store a scrambled version, so a database leak can't be used to act as someone.
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireUser(request: Request): Promise<UserRow> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "not_signed_in", "Please make a promise to get started.");

  const [user] = await query<UserRow>("SELECT * FROM users WHERE token_hash = $1", [hashToken(token)]);
  if (!user) throw new HttpError(401, "not_signed_in", "We couldn't find your promise. Please make a new one.");

  // Screens check in every 3 seconds, so only record this once a minute.
  await query("UPDATE users SET last_seen = now() WHERE id = $1 AND last_seen < now() - interval '1 minute'", [user.id]);
  return user;
}
