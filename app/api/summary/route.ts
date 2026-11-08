import { requireUser } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import { buildSummary } from "@/lib/state";

export const GET = route(async (request) => {
  const user = await requireUser(request);
  return ok(await buildSummary(user));
});
