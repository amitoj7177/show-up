import { hashToken, tokenFrom } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, route } from "@/lib/http";

export const POST = route(async (request) => {
  const token = tokenFrom(request);
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  return ok({ loggedOut: true });
});
