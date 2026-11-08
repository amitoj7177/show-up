import { timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";

function adminKeyMatches(given: unknown): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected || typeof given !== "string") return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const POST = route(async (request) => {
  const { adminKey } = await readBody(request);
  if (!adminKeyMatches(adminKey)) throw new HttpError(401, "bad_admin_key", "That admin key isn't right.");
  const rows = await query<{ google_email: string; requested_at: Date }>(
    "SELECT google_email, requested_at FROM fitbit_requests ORDER BY requested_at",
  );
  return ok({ emails: rows.map((row) => row.google_email), count: rows.length });
});
