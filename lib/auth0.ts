import { HttpError } from "./http";

const CONNECTION = process.env.AUTH0_CONNECTION || "Username-Password-Authentication";

function settings() {
  const { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET } = process.env;
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
    throw new HttpError(503, "accounts_off", "Sign-up isn't connected yet. Try the demo for now.");
  }
  const base = AUTH0_DOMAIN.startsWith("http") ? AUTH0_DOMAIN : `https://${AUTH0_DOMAIN}`;
  return { base, clientId: AUTH0_CLIENT_ID, clientSecret: AUTH0_CLIENT_SECRET };
}

async function post(path: string, body: object) {
  const { base } = settings();
  try {
    return await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new HttpError(503, "accounts_down", "We can't reach the sign-in service right now. Please try again.");
  }
}

export async function createAuth0User(email: string, password: string): Promise<void> {
  const { clientId } = settings();
  const response = await post("/dbconnections/signup", { client_id: clientId, email, password, connection: CONNECTION });
  if (response.ok) return;

  const problem = await response.json().catch(() => ({}));
  if (problem.name === "PasswordStrengthError" || problem.code === "invalid_password") {
    throw new HttpError(400, "weak_password", "Please choose a stronger password. Try mixing letters and numbers.");
  }

  throw new HttpError(400, "signup_failed", "We couldn't create that account. If you already have one, try logging in.");
}

export async function checkPassword(email: string, password: string): Promise<string> {
  const { clientId, clientSecret } = settings();
  const response = await post("/oauth/token", {
    grant_type: "http://auth0.com/oauth/grant-type/password-realm",
    realm: CONNECTION,
    username: email,
    password,
    client_id: clientId,
    client_secret: clientSecret,
    scope: "openid",
  });
  if (!response.ok) {
    throw new HttpError(401, "bad_login", "That email and password don't match.");
  }

  const { id_token: idToken } = await response.json();
  const payload = JSON.parse(Buffer.from(String(idToken).split(".")[1], "base64url").toString());
  if (typeof payload.sub !== "string") throw new HttpError(503, "accounts_down", "Something went wrong signing you in. Please try again.");
  return payload.sub;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { clientId } = settings();
  await post("/dbconnections/change_password", { client_id: clientId, email, connection: CONNECTION });
}
