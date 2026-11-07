import { sendPasswordReset } from "@/lib/auth0";
import { HttpError, ok, readBody, route } from "@/lib/http";

// Auth0 emails the reset link. The answer is the same whether or not the account exists.
export const POST = route(async (request) => {
  const { email } = await readBody(request);
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new HttpError(400, "bad_email", "Enter your email first.");
  }
  await sendPasswordReset(email);
  return ok({ message: "If that email has an account, we will send a reset link." });
});
