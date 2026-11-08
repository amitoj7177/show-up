import { requireUser } from "@/lib/auth";
import { demoToday } from "@/lib/demo";
import { ok, route } from "@/lib/http";
import { buildToday } from "@/lib/state";

export const GET = route(async (request) => {
  const params = new URL(request.url).searchParams;
  if (params.get("demo") === "1" && !request.headers.get("authorization")) {
    return ok(demoToday(params.get("mood")), "snapshot");
  }
  const user = await requireUser(request);
  return ok(await buildToday(user));
});
