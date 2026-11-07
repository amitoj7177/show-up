import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { HttpError, ok, readBody, route } from "@/lib/http";
import { MESSAGES } from "@/lib/rules";
import { buildToday, pairToday, requirePair } from "@/lib/state";

// Sends one pre-written message. We only accept ids from our list, so free text is impossible.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const { messageId } = await readBody(request);
  if (!MESSAGES.some((message) => message.id === messageId)) {
    throw new HttpError(400, "bad_message", "Please choose one of the messages.");
  }

  const pair = await requirePair(user);
  const saved = await query(
    `INSERT INTO encouragements (pair_id, from_user, day, message_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (pair_id, from_user, day) DO NOTHING RETURNING id`,
    [pair.id, user.id, pairToday(pair), messageId],
  );
  if (saved.length === 0) {
    throw new HttpError(409, "already_sent", "You already sent a message today. Thank you for showing up.");
  }
  return ok(await buildToday(user));
});
