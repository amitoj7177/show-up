import { randomBytes } from "node:crypto";
import { query } from "./db";
import { HttpError } from "./http";
import { todayIn } from "./rules";

const SCOPE = "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly";
const API = "https://health.googleapis.com/v4";

function settings() {
  const clientId = process.env.GOOGLE_HEALTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_HEALTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new HttpError(503, "fitbit_off", "Fitbit isn't connected to Promise Pals yet.");
  return { clientId, clientSecret };
}

export function fitbitAvailable(): boolean {
  return Boolean(process.env.GOOGLE_HEALTH_CLIENT_ID && process.env.GOOGLE_HEALTH_CLIENT_SECRET);
}

export function callbackUrl(request: Request): string {
  return `${new URL(request.url).origin}/api/fitbit/callback`;
}

export async function startConnecting(accountId: string, request: Request): Promise<string> {
  const { clientId } = settings();
  const state = randomBytes(24).toString("base64url");
  await query("DELETE FROM health_states WHERE created_at < now() - interval '15 minutes'");
  await query("INSERT INTO health_states (state, account_id) VALUES ($1, $2)", [state, accountId]);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(request),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function finishConnecting(state: string, code: string, request: Request): Promise<void> {
  const { clientId, clientSecret } = settings();
  const [row] = await query<{ account_id: string }>(
    "DELETE FROM health_states WHERE state = $1 AND created_at > now() - interval '15 minutes' RETURNING account_id",
    [state],
  );
  if (!row) throw new HttpError(400, "fitbit_expired", "That Fitbit link expired. Please try connecting again.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl(request), grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(10000),
  });
  const tokens = await response.json().catch(() => ({}));
  if (!response.ok || !tokens.refresh_token) {
    console.error("Google Health token exchange failed", response.status, tokens.error);
    throw new HttpError(400, "fitbit_failed", "We couldn't connect your Fitbit. Please try again.");
  }
  await query(
    `INSERT INTO health_links (account_id, refresh_token) VALUES ($1, $2)
     ON CONFLICT (account_id) DO UPDATE SET refresh_token = EXCLUDED.refresh_token, linked_at = now()`,
    [row.account_id, tokens.refresh_token],
  );
  await query("DELETE FROM fitbit_requests WHERE account_id = $1", [row.account_id]);
}

async function accessToken(refreshToken: string): Promise<string | null> {
  const { clientId, clientSecret } = settings();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: AbortSignal.timeout(8000),
  });
  const body = await response.json().catch(() => ({}));
  return response.ok ? body.access_token : null;
}

function totalCount(value: unknown): number {
  if (Array.isArray(value)) return value.reduce((sum: number, item) => sum + totalCount(item), 0);
  if (value && typeof value === "object") {
    return Object.entries(value).reduce((sum, [key, inner]) => {
      if (/^count/i.test(key) && (typeof inner === "number" || (typeof inner === "string" && /^\d+$/.test(inner)))) return sum + Number(inner);
      return sum + totalCount(inner);
    }, 0);
  }
  return 0;
}

function calgaryMidnight(now: Date): Date {
  const offsetHours = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Edmonton", timeZoneName: "shortOffset" }).formatToParts(now).find((part) => part.type === "timeZoneName")?.value.replace("GMT", "") || -7,
  );
  const start = new Date(`${todayIn(now)}T00:00:00Z`);
  start.setUTCHours(start.getUTCHours() - offsetHours);
  return start;
}

async function readData(token: string, dataType: string, filter: string): Promise<unknown[] | null> {
  try {
    const response = await fetch(`${API}/users/me/dataTypes/${dataType}/dataPoints?${new URLSearchParams({ filter, pageSize: "1440" })}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error(`Google Health ${dataType} request failed`, response.status, (await response.text()).slice(0, 200));
      return null;
    }
    return (await response.json()).dataPoints ?? [];
  } catch (error) {
    console.error(`Google Health ${dataType} request failed`, error);
    return null;
  }
}

type Workout = { exercise?: { displayName?: string; activeDuration?: string } };

export function describeWorkouts(points: unknown[]): string | null {
  const minutes = new Map<string, number>();
  for (const point of points as Workout[]) {
    const name = point.exercise?.displayName;
    const seconds = Number.parseFloat(point.exercise?.activeDuration ?? "0");
    if (name && seconds > 0) minutes.set(name, (minutes.get(name) ?? 0) + seconds / 60);
  }
  const parts = [...minutes].map(([name, total]) => `${name} ${Math.max(1, Math.round(total))} min`);
  return parts.length ? parts.join(", ") : null;
}

export function activeMinutes(points: unknown[]): number {
  return (points as { activeZoneMinutes?: { activeZoneMinutes?: string | number } }[]).reduce(
    (sum, point) => sum + (Number(point.activeZoneMinutes?.activeZoneMinutes) || 0),
    0,
  );
}

export type FitbitDay = { steps: number | null; workout: string | null; activeMinutes: number | null };

export async function fitbitToday(accountId: string, now = new Date()): Promise<FitbitDay | null> {
  if (!fitbitAvailable()) return null;
  const [link] = await query<{ refresh_token: string }>("SELECT refresh_token FROM health_links WHERE account_id = $1", [accountId]);
  if (!link) return null;
  const token = await accessToken(link.refresh_token);
  if (!token) return { steps: null, workout: null, activeMinutes: null };

  const start = calgaryMidnight(now).toISOString();
  const [steps, zones, workouts] = await Promise.all([
    readData(token, "steps", `steps.interval.start_time >= "${start}" AND steps.interval.start_time < "${now.toISOString()}"`),
    readData(
      token,
      "active-zone-minutes",
      `active_zone_minutes.interval.start_time >= "${start}" AND active_zone_minutes.interval.start_time < "${now.toISOString()}"`,
    ),

    readData(token, "exercise", `exercise.interval.civil_start_time >= "${todayIn(now)}"`),
  ]);
  return {
    steps: steps ? totalCount(steps) : null,
    workout: workouts ? describeWorkouts(workouts) : null,
    activeMinutes: zones ? activeMinutes(zones) : null,
  };
}

export async function isConnected(accountId: string): Promise<boolean> {
  const [link] = await query("SELECT 1 FROM health_links WHERE account_id = $1", [accountId]);
  return Boolean(link);
}

export async function disconnect(accountId: string): Promise<void> {
  await query("DELETE FROM health_links WHERE account_id = $1", [accountId]);
}
