"use client";

import { useEffect, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON } from "./Shared";

type Status = { available: boolean; connected: boolean; stepsToday: number | null };

const RESULT_MESSAGES: Record<string, string> = {
  connected: "Fitbit connected. Your steps now count as proof when you check in.",
  declined: "Fitbit wasn't connected. You can try again any time.",
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
          <p className="text-muted">When you check in, today&apos;s steps are added as proof your partner can see.</p>
          <button type="button" className={QUIET_BUTTON} onClick={disconnect}>
            Disconnect Fitbit
          </button>
        </>
      ) : (
        <>
          <p>Connect your Fitbit and your steps prove you did it automatically. Your partner sees today&apos;s step count, nothing else.</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={connect}>
            Connect Fitbit
          </button>
          <p className="text-muted">You&apos;ll need the Google Health app signed in with your Fitbit account.</p>
        </>
      )}
      {error && <ErrorNote message={error} />}
    </Card>
  );
}
