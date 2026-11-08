"use client";

import { useEffect, useState } from "react";
import { api, ApiError, getToken } from "@/lib/api";
import { IPHONE_SHORTCUT, POINTS } from "@/lib/rules";
import { clockTime } from "./Moments";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON } from "./Shared";

type Status = { linked: boolean; stepsToday: number | null; sentAt: string | null; link?: string };

const LINK_KEY = "phoneStepsLink";

// This phone's private link, kept on the phone so the shortcut can be handed it every time.
function savedLink(): string {
  try {
    return localStorage.getItem(LINK_KEY) ?? "";
  } catch {
    return "";
  }
}

// Opens the Shortcuts app, runs the Promise Pals shortcut with this phone's private link, then comes back here.
export function runShortcutUrl(link: string): string {
  const params = new URLSearchParams({ name: IPHONE_SHORTCUT.name, input: "text", text: link, "x-success": `${window.location.origin}/?phone=sent` });
  return `shortcuts://x-callback-url/run-shortcut?${params.toString().replace(/\+/g, "%20")}`;
}

// iPhone steps from Apple Health. Set up once, then one tap a day.
export function PhoneStepsCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLink(savedLink());
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
      try {
        localStorage.setItem(LINK_KEY, fresh.link ?? "");
      } catch {
        // Private browsing: it still works until this page closes.
      }
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  async function unlink() {
    const response = await fetch("/api/phone-steps/link", { method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` } });
    if (response.ok) {
      setStatus((await response.json()).data);
      setLink("");
      try {
        localStorage.removeItem(LINK_KEY);
      } catch {
        // Nothing saved.
      }
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
  }

  if (!status) return null;
  const ready = status.linked && link;

  return (
    <Card title="iPhone steps">
      {!ready ? (
        <>
          <p>No Fitbit? Your iPhone counts steps too. Send today&apos;s steps from Apple Health as proof, in one tap.</p>
          <p className="text-muted">Worth +{POINTS.phone} points. A Fitbit is worth more, because Google confirms its numbers.</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={makeLink}>
            Set up iPhone steps
          </button>
        </>
      ) : (
        <>
          <p>
            {status.stepsToday !== null ? (
              <>
                <strong>{status.stepsToday.toLocaleString("en-CA")}</strong> steps sent today
                {status.sentAt && ` at ${clockTime(status.sentAt)}`}.
              </>
            ) : (
              "No steps sent today yet."
            )}
          </p>

          {IPHONE_SHORTCUT.url && status.stepsToday === null && (
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                <a href={IPHONE_SHORTCUT.url} className="px-link font-semibold">
                  Add the Promise Pals shortcut
                </a>{" "}
                (once), then tap <strong>Add Shortcut</strong>.
              </li>
              <li>Come back and tap the button below.</li>
            </ol>
          )}

          <a href={runShortcutUrl(link)} className={PRIMARY_BUTTON}>
            Send today&apos;s steps
          </a>
          <p className="text-muted">The first time, your iPhone asks to share step data. Tap Allow.</p>

          {!IPHONE_SHORTCUT.url && (
            <details className="space-y-3">
              <summary className="min-h-11 cursor-pointer py-2 font-semibold">First time? Make the shortcut (2 minutes)</summary>
              <p className="px-input break-all select-all">{link}</p>
              <button type="button" className={SECONDARY_BUTTON} onClick={copy}>
                {copied ? "Copied ✓" : "Copy your private link"}
              </button>
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  In Shortcuts, tap +, and name it <strong>{IPHONE_SHORTCUT.name}</strong>.
                </li>
                <li>
                  Add <strong>Find Health Samples</strong>: Steps, Start Date is today.
                </li>
                <li>
                  Add <strong>Calculate Statistics</strong>: Sum.
                </li>
                <li>
                  Add <strong>Get Contents of URL</strong>: paste your link, Method POST, JSON field <strong>steps</strong> = Statistics.
                </li>
              </ol>
            </details>
          )}
        </>
      )}

      {error && <ErrorNote message={error} />}
      {status.linked && (
        <button type="button" className={QUIET_BUTTON} onClick={unlink}>
          Stop using iPhone steps
        </button>
      )}
    </Card>
  );
}
