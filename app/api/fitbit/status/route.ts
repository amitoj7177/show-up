import { requireAccount } from "@/lib/auth";
import { disconnect, fitbitAvailable, fitbitToday, isConnected } from "@/lib/fitbit";
import { ok, route } from "@/lib/http";

// Whether Fitbit is set up, whether you've connected yours, and today's steps and workouts so far.
export const GET = route(async (request) => {
  const account = await requireAccount(request);
  const connected = fitbitAvailable() && (await isConnected(account.id));
  const day = connected ? await fitbitToday(account.id) : null;
  return ok({ available: fitbitAvailable(), connected, stepsToday: day?.steps ?? null, workoutToday: day?.workout ?? null });
});

// Disconnect your Fitbit. We delete our access to it.
export const DELETE = route(async (request) => {
  const account = await requireAccount(request);
  await disconnect(account.id);
  return ok({ available: fitbitAvailable(), connected: false, stepsToday: null, workoutToday: null });
});
