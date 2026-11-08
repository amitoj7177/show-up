import { finishConnecting } from "@/lib/fitbit";
import { HttpError } from "@/lib/http";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const home = new URL("/", request.url);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    home.searchParams.set("fitbit", "declined");
    return Response.redirect(home, 302);
  }
  try {
    await finishConnecting(state, code, request);
    home.searchParams.set("fitbit", "connected");
  } catch (error) {
    if (!(error instanceof HttpError)) console.error(error);
    home.searchParams.set("fitbit", "failed");
  }
  return Response.redirect(home, 302);
}
