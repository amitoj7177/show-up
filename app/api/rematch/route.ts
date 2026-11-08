import { requireUser } from "@/lib/auth";
import { query, type UserRow } from "@/lib/db";
import { HttpError, ok, route } from "@/lib/http";
import { pairWithDemoPartner } from "@/lib/matching";
import { canOfferNewMatch, summaryDue, type CheckinStatus, type DayCheckins } from "@/lib/rules";
import { buildToday, endPair, pairToday, partnerIdOf, requirePair } from "@/lib/state";

export const POST = route(async (request) => {
  const user = await requireUser(request);
  const pair = await requirePair(user);
  const partnerId = partnerIdOf(pair, user.id);
  const today = pairToday(pair);

  const rows = await query<{ day: string; status: CheckinStatus }>(
    "SELECT day, status FROM checkins WHERE pair_id = $1 AND user_id = $2",
    [pair.id, partnerId],
  );
  const partnerCheckins: DayCheckins = Object.fromEntries(rows.map((row) => [row.day, row.status]));

  const partnerWentSilent = canOfferNewMatch(partnerCheckins, pair.started_on, today);
  if (!partnerWentSilent && !summaryDue(pair.started_on, today)) {
    throw new HttpError(409, "too_soon", "You can get a new match after 2 silent days, or at the end of the week.");
  }

  await endPair(pair, user.id, {
    reason: "new_match",
    myNextStatus: "waiting",
    partnerNextStatus: partnerWentSilent ? "inactive" : "waiting",
  });

  if (pair.is_demo) await pairWithDemoPartner(user);

  const [fresh] = await query<UserRow>("SELECT * FROM users WHERE id = $1", [user.id]);
  return ok(await buildToday(fresh));
});
