import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { answerRequest } from "@/lib/nearby";
import { buildToday } from "@/lib/state";

// Answer someone who asked to team up: "Team up" pairs you both, "Not now" hides you from them.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { requestId, accept } = await readBody(request);
  if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/.test(requestId) || typeof accept !== "boolean") {
    throw new HttpError(400, "bad_answer", "Please answer yes or not now.");
  }
  await answerRequest(user.id, requestId, accept);
  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
