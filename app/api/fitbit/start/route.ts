import { requireAccount } from "@/lib/auth";
import { startConnecting } from "@/lib/fitbit";
import { ok, route } from "@/lib/http";

export const POST = route(async (request) => {
  const account = await requireAccount(request);
  return ok({ url: await startConnecting(account.id, request) });
});
