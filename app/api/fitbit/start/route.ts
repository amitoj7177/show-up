import { requireAccount } from "@/lib/auth";
import { startConnecting } from "@/lib/fitbit";
import { ok, route } from "@/lib/http";

// Starts connecting a Fitbit: returns the Google page to send the person to.
export const POST = route(async (request) => {
  const account = await requireAccount(request);
  return ok({ url: await startConnecting(account.id, request) });
});
