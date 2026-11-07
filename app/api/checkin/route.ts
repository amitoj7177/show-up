import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { buildToday, pairToday, requirePair } from "@/lib/state";

// The big "Done" and "Rough day" buttons. Tapping again today changes your answer.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { status } = await readBody(request);
  if (status !== "done" && status !== "rough") {
    throw new HttpError(400, "bad_status", "Please choose Done or Rough day.");
  }

  const pair = await requirePair(user);
  await saveCheckin(pair.id, user, pairToday(pair), status);
  return ok(await buildToday(user));
});

async function saveCheckin(pairId: string, user: UserRow, day: string, status: "done" | "rough") {
  await query(
    `INSERT INTO checkins (pair_id, user_id, day, status) VALUES ($1, $2, $3, $4)
     ON CONFLICT (pair_id, user_id, day) DO UPDATE SET status = EXCLUDED.status`,
    [pairId, user.id, day, status],
  );
}
