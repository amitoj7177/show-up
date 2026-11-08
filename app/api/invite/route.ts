import { requireUser } from "@/lib/auth";
import { HttpError, ok, route } from "@/lib/http";
import { inviteCodeFor, inviterName } from "@/lib/nearby";

export const GET = route(async (request) => {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(code)) throw new HttpError(400, "bad_invite", "That invite link isn't right.");
  return ok({ firstName: await inviterName(code) });
});

export const POST = route(async (request) => {
  const user = await requireUser(request);
  if (user.status !== "waiting") throw new HttpError(409, "not_looking", "You already have a partner.");
  const code = await inviteCodeFor(user.id);
  return ok({ link: `${new URL(request.url).origin}/?invite=${code}` });
});
