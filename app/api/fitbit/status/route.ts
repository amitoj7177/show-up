import { requireAccount } from "@/lib/auth";
import { disconnect, fitbitAvailable, isConnected, stepsToday } from "@/lib/fitbit";
import { ok, route } from "@/lib/http";

// Whether Fitbit is set up, whether you've connected yours, and today's steps so far.
export const GET = route(async (request) => {
  const account = await requireAccount(request);
  const connected = fitbitAvailable() && (await isConnected(account.id));
  return ok({ available: fitbitAvailable(), connected, stepsToday: connected ? await stepsToday(account.id) : null });
});

// Disconnect your Fitbit. We delete our access to it.
export const DELETE = route(async (request) => {
  const account = await requireAccount(request);
  await disconnect(account.id);
  return ok({ available: fitbitAvailable(), connected: false, stepsToday: null });
});
