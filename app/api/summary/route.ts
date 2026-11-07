import { requireUser } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import { buildSummary } from "@/lib/state";

// The honest weekly summary: done, rough and silent days for both partners.
export const GET = route(async (request) => {
  const user = await requireUser(request);
  return ok(await buildSummary(user));
});
