import { HttpError, ok, route } from "@/lib/http";
import { readSteps, savePhoneSteps } from "@/lib/phone";

// The iPhone shortcut sends today's steps here, to the private link from the app.
// Steps can come as JSON ({ "steps": 6816 }) or in the link (&steps=6816).
export const POST = route(async (request) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!key) throw new HttpError(401, "bad_link", "That Promise Pals link is missing its key. Copy it again from the app.");
  const body = await request.json().catch(() => ({}));
  const steps = readSteps(body?.steps ?? url.searchParams.get("steps"));
  if (steps === null) throw new HttpError(400, "bad_steps", "We didn't get a step count. Check the shortcut sends \"steps\".");
  await savePhoneSteps(key, steps);
  return ok({ saved: steps });
});
