import { requireAccount } from "@/lib/auth";
import { disconnect, fitbitAvailable, fitbitToday, isConnected } from "@/lib/fitbit";
import { ok, route } from "@/lib/http";

export const GET = route(async (request) => {
  const account = await requireAccount(request);
  const connected = fitbitAvailable() && (await isConnected(account.id));
  const day = connected ? await fitbitToday(account.id) : null;
  return ok({ available: fitbitAvailable(), connected, stepsToday: day?.steps ?? null, workoutToday: day?.workout ?? null, activeMinutesToday: day?.activeMinutes ?? null });
});

export const DELETE = route(async (request) => {
  const account = await requireAccount(request);
  await disconnect(account.id);
  return ok({ available: fitbitAvailable(), connected: false, stepsToday: null, workoutToday: null });
});
