"use client";

import { useEffect, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON } from "./Shared";

type Status = { available: boolean; connected: boolean; stepsToday: number | null; workoutToday?: string | null; activeMinutesToday?: number | null };

const RESULT_MESSAGES: Record<string, string> = {
  connected: "Fitbit connected. Your steps now count as proof when you check in.",
  declined: "Fitbit wasn't connected. If Google said \"Access blocked\", your Google account hasn't been invited yet. Ask the Promise Pals team to add it.",
  failed: "We couldn't connect your Fitbit. Please try again.",
};

// Connect a Fitbit, so your steps prove you did it, with no photo needed.
export function FitbitCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Coming back from Google's "Allow" page.
    const result = new URLSearchParams(window.location.search).get("fitbit");
    if (result && RESULT_MESSAGES[result]) {
      setMessage(RESULT_MESSAGES[result]);
      window.history.replaceState(null, "", "/");
    }
    api<Status>("/api/fitbit/status", { token: getToken() })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function connect() {
    setError("");
    try {
      const { url } = await api<{ url: string }>("/api/fitbit/start", { post: true, token: getToken() });
      window.location.href = url;
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  async function disconnect() {
    const response = await fetch("/api/fitbit/status", { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (response.ok) setStatus((await response.json()).data);
  }

  if (!status?.available) return null;

  return (
    <Card title="Fitbit">
      {message && (
        <p role="status" className="font-semibold">
          {message}
        </p>
      )}
      {status.connected ? (
        <>
          <p>
            Connected.{" "}
            {status.stepsToday !== null ? (
              <>
                <strong>{status.stepsToday.toLocaleString("en-CA")}</strong> steps so far today.
              </>
            ) : (
              "We couldn't read today's steps just now."
            )}
          </p>
          <p>{status.workoutToday ? <>Workouts today: <strong>{status.workoutToday}</strong>.</> : "No workouts logged today yet."}</p>
          {typeof status.activeMinutesToday === "number" && (
            <p>
              <strong>{status.activeMinutesToday}</strong> active minutes today. They come from your heart rate, so they count for any kind of
              movement, not just steps.
            </p>
          )}
          <p className="text-muted">When you check in, today&apos;s steps and workouts are added as proof your partner can see.</p>
          <button type="button" className={QUIET_BUTTON} onClick={disconnect}>
            Disconnect Fitbit
          </button>
        </>
      ) : (
        <>
          <p>Connect your Fitbit and your steps prove you did it automatically. Your partner sees today&apos;s steps and workout names, nothing else.</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={connect}>
            Connect Fitbit
          </button>
          <RequestAccess />
          <p className="text-muted">You&apos;ll need the Google Health app signed in with your Fitbit account.</p>
        </>
      )}
      {error && <ErrorNote message={error} />}
    </Card>
  );
}

// A small prompt on the Today screen, for people who haven't connected a Fitbit yet.
export function FitbitNudge({ onOpen }: { onOpen: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    api<Status>("/api/fitbit/status", { token: getToken() })
      .then((status) => setShow(status.available && !status.connected))
      .catch(() => setShow(false));
  }, []);
  if (!show) return null;
  return (
    <button type="button" className={QUIET_BUTTON} onClick={onOpen}>
      Have a Fitbit? Connect it for automatic proof
    </button>
  );
}

// While Fitbit is in Google's testing stage, people must be invited first. This asks the team to add you.
function RequestAccess() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ requested: boolean; email: string | null }>("/api/fitbit/request", { token: getToken() })
      .then((result) => setRequested(result.requested ? result.email : null))
      .catch(() => undefined);
  }, []);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api("/api/fitbit/request", { body: { email }, token: getToken() });
      setRequested(email.trim().toLowerCase());
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  if (requested) {
    return (
      <p role="status" className="font-semibold">
        Access requested for {requested}. Try Connect Fitbit again once the team adds you.
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" className={QUIET_BUTTON} onClick={() => setOpen(true)}>
        Google said &quot;Access blocked&quot;? Request access
      </button>
    );
  }
  return (
    <form onSubmit={send} className="space-y-3">
      <p>Fitbit is in Google&apos;s testing stage, so the team adds people by hand. Tell us the Google email your Fitbit uses.</p>
      <div>
        <label htmlFor="fitbit-email" className="px-label">
          Google email
        </label>
        <input id="fitbit-email" type="email" className="px-input" required value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
      </div>
      <p className="text-muted">We keep this email only until you connect, then delete it.</p>
      {error && <ErrorNote message={error} />}
      <button type="submit" className={PRIMARY_BUTTON}>
        Request access
      </button>
    </form>
  );
}
