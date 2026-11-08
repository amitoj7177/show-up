import { requireAccount } from "@/lib/auth";
import { ok, route } from "@/lib/http";
import { newPhoneLink, phoneStatus, unlinkPhone } from "@/lib/phone";

// Whether iPhone steps are set up, and today's steps so far.
export const GET = route(async (request) => {
  const account = await requireAccount(request);
  return ok(await phoneStatus(account.id));
});

// Make a private link for the iPhone shortcut. Only shown once; a new one replaces the old one.
export const POST = route(async (request) => {
  const account = await requireAccount(request);
  const link = await newPhoneLink(account.id, new URL(request.url).origin);
  return ok({ ...(await phoneStatus(account.id)), link });
});

// Stop using iPhone steps. The link stops working and the saved steps are deleted.
export const DELETE = route(async (request) => {
  const account = await requireAccount(request);
  await unlinkPhone(account.id);
  return ok(await phoneStatus(account.id));
});
