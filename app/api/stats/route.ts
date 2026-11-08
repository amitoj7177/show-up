import { query } from "@/lib/db";
import { ok, route } from "@/lib/http";

export const GET = route(async () => {
  const [row] = await query<Record<string, string>>(`
    SELECT
      (SELECT count(*) FROM users WHERE NOT is_demo) AS people,
      (SELECT count(*) FROM pairs WHERE NOT is_demo) AS pairs,
      (SELECT count(*) FROM checkins c JOIN pairs p ON p.id = c.pair_id WHERE NOT p.is_demo AND c.status = 'done') AS done,
      (SELECT count(*) FROM checkins c JOIN pairs p ON p.id = c.pair_id WHERE NOT p.is_demo AND c.status = 'rough') AS rough,
      (SELECT count(*) FROM encouragements e JOIN pairs p ON p.id = e.pair_id WHERE NOT p.is_demo) AS messages,
      (SELECT count(DISTINCT c.user_id) FROM checkins c JOIN pairs p ON p.id = c.pair_id
        WHERE NOT p.is_demo AND c.day > p.started_on) AS came_back_after_day_one
  `);
  return ok({
    people: Number(row.people),
    pairs: Number(row.pairs),
    doneCheckins: Number(row.done),
    roughDays: Number(row.rough),
    messagesSent: Number(row.messages),
    cameBackAfterDayOne: Number(row.came_back_after_day_one),
  });
});
