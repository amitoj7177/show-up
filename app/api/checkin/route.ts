import { findAccount, requireUser } from "@/lib/auth";
import { fitbitToday } from "@/lib/fitbit";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { checkProofPhoto, photoData } from "@/lib/moderation";
import { buildToday, pairToday, requirePair } from "@/lib/state";

// "Check in" (done) or "Skip today" (rough). A check-in can include a photo as proof.
// Tapping again today changes your answer.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { status, photo } = await readBody(request);
  if (status !== "done" && status !== "rough") {
    throw new HttpError(400, "bad_status", "Please check in or skip today.");
  }

  // A proof photo is checked by Gemini before your partner can see it.
  let proof: { data: string; note: string } | null = null;
  if (status === "done" && photo !== undefined && photo !== null) {
    const data = photoData(photo);
    proof = { data, note: (await checkProofPhoto(data)).description };
  }

  // If they've connected a Fitbit, today's steps and workouts are saved as automatic proof.
  const account = status === "done" ? await findAccount(request) : undefined;
  const fitbit = account ? await fitbitToday(account.id) : null;

  const pair = await requirePair(user);
  await query(
    `INSERT INTO checkins (pair_id, user_id, day, status, photo, photo_note, fitbit_steps, fitbit_workout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (pair_id, user_id, day) DO UPDATE SET
       status = EXCLUDED.status,
       photo = COALESCE(EXCLUDED.photo, CASE WHEN EXCLUDED.status = 'done' THEN checkins.photo END),
       photo_note = COALESCE(EXCLUDED.photo_note, CASE WHEN EXCLUDED.status = 'done' THEN checkins.photo_note END),
       confirmed_at = CASE WHEN EXCLUDED.status = 'done' THEN checkins.confirmed_at END,
       fitbit_steps = CASE WHEN EXCLUDED.status = 'done' THEN COALESCE(EXCLUDED.fitbit_steps, checkins.fitbit_steps) END,
       fitbit_workout = CASE WHEN EXCLUDED.status = 'done' THEN COALESCE(EXCLUDED.fitbit_workout, checkins.fitbit_workout) END`,
    [pair.id, user.id, pairToday(pair), status, proof?.data ?? null, proof?.note ?? null, fitbit?.steps ?? null, fitbit?.workout ?? null],
  );
  return ok(await buildToday(user));
});
