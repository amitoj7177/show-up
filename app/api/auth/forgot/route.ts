import { sendPasswordReset } from "@/lib/auth0";
import { HttpError, ok, readBody, route } from "@/lib/http";

export const POST = route(async (request) => {
  const { email } = await readBody(request);
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(400, "bad_email", "Enter your email first.");
  }
  await sendPasswordReset(email);
  return ok({ message: "If that email has an account, we will send a reset link." });
});
