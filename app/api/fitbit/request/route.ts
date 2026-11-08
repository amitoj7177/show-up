import { requireAccount } from "@/lib/auth";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";

export const POST = route(async (request) => {
  const account = await requireAccount(request);
  const { email } = await readBody(request);
  const googleEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(googleEmail) || googleEmail.length > 120) {
    throw new HttpError(400, "bad_email", "Enter the Google email your Fitbit uses.");
  }
  await query(
    `INSERT INTO fitbit_requests (account_id, google_email) VALUES ($1, $2)
     ON CONFLICT (account_id) DO UPDATE SET google_email = EXCLUDED.google_email, requested_at = now()`,
    [account.id, googleEmail],
  );
  return ok({ requested: true });
});

export const GET = route(async (request) => {
  const account = await requireAccount(request);
  const [row] = await query<{ google_email: string }>("SELECT google_email FROM fitbit_requests WHERE account_id = $1", [account.id]);
  return ok({ requested: Boolean(row), email: row?.google_email ?? null });
});
