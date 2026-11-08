import { hashToken, newToken } from "./auth";
import { query } from "./db";
import { HttpError } from "./http";
import { todayIn } from "./rules";
import { findActivePair, pairToday } from "./state";

// iPhone steps. Apple doesn't let websites read Apple Health, so Apple's Shortcuts app does it:
// a shortcut on the phone reads today's steps and sends them to a private link made for each person.

// A new private link for the shortcut. Making a new one stops the old one working.
export async function newPhoneLink(accountId: string, origin: string): Promise<string> {
  const key = newToken();
  await query("UPDATE accounts SET phone_key_hash = $2 WHERE id = $1", [accountId, hashToken(key)]);
  return `${origin}/api/phone-steps?key=${key}`;
}

// Shortcuts can send the number in different shapes, like 6816, "6,816" or "6816.0".
export function readSteps(value: unknown): number | null {
  const steps = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value.replace(/,/g, "")) : NaN;
  if (!Number.isFinite(steps) || steps < 0 || steps > 200000) return null;
  return Math.round(steps);
}

// Saves today's steps sent from the shortcut. If they've already checked in today, the proof is updated too.
export async function savePhoneSteps(key: string, steps: number, now = new Date()): Promise<void> {
  const [account] = await query<{ id: string; user_id: string | null }>(
    `UPDATE accounts SET phone_steps = $2, phone_steps_day = $3, phone_steps_at = now() WHERE phone_key_hash = $1 RETURNING id, user_id`,
    [hashToken(key), steps, todayIn(now)],
  );
  if (!account) throw new HttpError(401, "bad_link", "That Promise Pals link doesn't work any more. Make a new one in the app.");
  if (!account.user_id) return;
  const pair = await findActivePair(account.user_id);
  if (pair) {
    await query("UPDATE checkins SET phone_steps = $3 WHERE pair_id = $1 AND user_id = $2 AND day = $4 AND status = 'done'", [
      pair.id,
      account.user_id,
      steps,
      pairToday(pair, now),
    ]);
  }
}

// Whether the shortcut is set up, and the steps it sent today (null if none yet).
export async function phoneStatus(accountId: string, now = new Date()): Promise<{ linked: boolean; stepsToday: number | null; sentAt: string | null }> {
  const [row] = await query<{ linked: boolean; phone_steps: number | null; phone_steps_day: string | null; phone_steps_at: Date | null }>(
    "SELECT phone_key_hash IS NOT NULL AS linked, phone_steps, phone_steps_day::text, phone_steps_at FROM accounts WHERE id = $1",
    [accountId],
  );
  const today = row?.phone_steps_day === todayIn(now);
  return {
    linked: Boolean(row?.linked),
    stepsToday: today ? row.phone_steps : null,
    sentAt: today && row.phone_steps_at ? new Date(row.phone_steps_at).toISOString() : null,
  };
}

export async function unlinkPhone(accountId: string): Promise<void> {
  await query("UPDATE accounts SET phone_key_hash = NULL, phone_steps = NULL, phone_steps_day = NULL, phone_steps_at = NULL WHERE id = $1", [accountId]);
}
