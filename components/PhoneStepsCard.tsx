"use client";

import { useEffect, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { POINTS } from "@/lib/rules";
import { clockTime } from "./Moments";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON } from "./Shared";

type Status = { linked: boolean; stepsToday: number | null; sentAt: string | null; link?: string };

// iPhone steps from Apple Health, sent by Apple's Shortcuts app to a private link.
export function PhoneStepsCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Status>("/api/phone-steps/link", { token: getToken() })
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  async function makeLink() {
    setError("");
    try {
      const fresh = await api<Status>("/api/phone-steps/link", { post: true, token: getToken() });
      setStatus(fresh);
      setLink(fresh.link ?? "");
      setCopied(false);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  async function unlink() {
    const response = await fetch("/api/phone-steps/link", { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (response.ok) {
      setStatus((await response.json()).data);
      setLink("");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  if (!status) return null;

  return (
    <Card title="iPhone steps">
      {!status.linked ? (
        <>
          <p>No Fitbit? Your iPhone counts steps too. Apple&apos;s Shortcuts app can send today&apos;s steps from Apple Health as proof.</p>
          <p className="text-muted">
            Worth +{POINTS.phone} points. A Fitbit is worth more, because Google confirms its numbers.
          </p>
          <button type="button" className={PRIMARY_BUTTON} onClick={makeLink}>
            Set up iPhone steps
          </button>
        </>
      ) : (
        <p>
          {status.stepsToday !== null ? (
            <>
              <strong>{status.stepsToday.toLocaleString("en-CA")}</strong> steps sent today
              {status.sentAt && ` at ${clockTime(status.sentAt)}`}.
            </>
          ) : (
            "Set up. No steps sent today yet. Run your shortcut."
          )}
        </p>
      )}

      {link && (
        <div className="space-y-3">
          <p className="font-bold">Your private link (it&apos;s only shown once):</p>
          <p className="px-input break-all select-all">{link}</p>
          <button type="button" className={SECONDARY_BUTTON} onClick={copy}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <ol className="list-decimal space-y-2 pl-6">
            <li>Open the Shortcuts app, tap +, and name it &ldquo;Promise Pals steps&rdquo;.</li>
            <li>
              Add <strong>Find Health Samples</strong>. Set Type to <strong>Steps</strong> and Start Date to <strong>is today</strong>.
            </li>
            <li>
              Add <strong>Calculate Statistics</strong> and pick <strong>Sum</strong>.
            </li>
            <li>
              Add <strong>Get Contents of URL</strong> and paste your link. Tap the arrow, set Method to <strong>POST</strong>, Request Body to{" "}
              <strong>JSON</strong>, and add a Number field called <strong>steps</strong> set to <strong>Statistics</strong>.
            </li>
            <li>Tap ▶ to run it once, and allow Health access when asked.</li>
            <li>
              Optional: in Automation, add <strong>Time of Day</strong>, 8:00 PM, <strong>Run Immediately</strong>, and pick this shortcut.
            </li>
          </ol>
        </div>
      )}

      {error && <ErrorNote message={error} />}
      {status.linked && (
        <>
          {!link && (
            <button type="button" className={QUIET_BUTTON} onClick={makeLink}>
              Show setup again (makes a new link)
            </button>
          )}
          <button type="button" className={QUIET_BUTTON} onClick={unlink}>
            Stop using iPhone steps
          </button>
        </>
      )}
    </Card>
  );
}
