import { requireUser } from "@/lib/auth";
import { demoToday } from "@/lib/demo";
import { ok, route } from "@/lib/http";
import { buildToday } from "@/lib/state";

// Screens 2 and 3: everything they need. Ask for this every 3 seconds.
// With ?demo=1 and no sign-in, it returns labelled sample data. Add &mood=mad to see a mood.
export const GET = route(async (request) => {
  const params = new URL(request.url).searchParams;
  if (params.get("demo") === "1" && !request.headers.get("authorization")) {
    return ok(demoToday(params.get("mood")), "snapshot");
  }
  const user = await requireUser(request);
  return ok(await buildToday(user));
});
