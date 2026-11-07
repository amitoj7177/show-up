import { findGroupByStaffKey, groupTotals } from "@/lib/groups";
import { HttpError, ok, readBody, route } from "@/lib/http";

// The clinic staff screen. The staff key goes in the request body, never the web address.
export const POST = route(async (request) => {
  const { staffKey } = await readBody(request);
  const group = typeof staffKey === "string" && staffKey ? await findGroupByStaffKey(staffKey.trim()) : undefined;
  if (!group) throw new HttpError(401, "bad_staff_key", "That staff key doesn't match a clinic.");
  return ok(await groupTotals(group));
});
