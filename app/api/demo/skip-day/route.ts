import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ok, route } from "@/lib/http";
import { buildToday, requireDemoPair } from "@/lib/state";

// Demo only: jump to tomorrow, so judges can see a missed day without waiting.
export const POST = route(async (request) => {
  const user = await requireUser(request);
  const pair = await requireDemoPair(user);
  await query("UPDATE pairs SET day_offset = day_offset + 1 WHERE id = $1", [pair.id]);
  return ok(await buildToday(user));
});
