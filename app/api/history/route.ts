import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { historyDays, PROMISE_DAYS, todayIn, type CheckinStatus, type DayCheckins } from "@/lib/rules";
import { findActivePair, pairToday } from "@/lib/state";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  const pair = await findActivePair(user.id);
  const today = pair ? pairToday(pair) : todayIn(new Date());

  const [first] = await query<{ day: string | null }>(
    "SELECT min(started_on)::text AS day FROM pairs WHERE user_a = $1 OR user_b = $1",
    [user.id],
  );
  const rows = await query<{ day: string; status: CheckinStatus }>("SELECT day, status FROM checkins WHERE user_id = $1", [user.id]);
  const checkins: DayCheckins = Object.fromEntries(rows.map((row) => [row.day, row.status]));
  const days = first?.day ? historyDays(checkins, first.day, today) : [];

  return ok({ promise: user.goal_text, days, finished: days.length >= PROMISE_DAYS });
});
