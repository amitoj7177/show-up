"use client";

import { useState, type FormEvent } from "react";
import { Card, ErrorNote, PRIMARY_BUTTON, SECONDARY_BUTTON, TitleBar } from "@/components/Shared";
import { api, ApiError } from "@/lib/api";

// For the team: copy everyone who asked for Fitbit access, then paste them into Google in one go.
export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [emails, setEmails] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    try {
      setEmails((await api<{ emails: string[] }>("/api/admin/fitbit-requests", { body: { adminKey } })).emails);
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  }

  async function copyAll() {
    if (!emails) return;
    await navigator.clipboard.writeText(emails.join(", "));
    setCopied(true);
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
      <div className="px-card overflow-hidden">
        <TitleBar title="Fitbit testers" />
        <div className="space-y-4 p-5">
          {!emails ? (
            <form onSubmit={load} className="space-y-4">
              <p>People who asked to connect a Fitbit. Only the team can open this.</p>
              <div>
                <label htmlFor="admin-key" className="px-label">
                  Admin key
                </label>
                <input id="admin-key" type="password" className="px-input" required value={adminKey} onChange={(event) => setAdminKey(event.target.value)} />
              </div>
              {error && <ErrorNote message={error} />}
              <button type="submit" className={PRIMARY_BUTTON}>
                Show the list
              </button>
            </form>
          ) : (
            <>
              <Card title={`${emails.length} waiting`}>
                {emails.length === 0 ? (
                  <p>Nobody is waiting right now.</p>
                ) : (
                  <ul className="space-y-1 break-all">
                    {emails.map((email) => (
                      <li key={email}>{email}</li>
                    ))}
                  </ul>
                )}
              </Card>
              {emails.length > 0 && (
                <button type="button" className={PRIMARY_BUTTON} onClick={copyAll}>
                  {copied ? "Copied ✓" : "Copy all"}
                </button>
              )}
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  Open{" "}
                  <a className="px-link" href="https://console.developers.google.com/auth/audience" target="_blank" rel="noreferrer">
                    Google&apos;s Audience page
                  </a>{" "}
                  (the project whose client ID starts 817).
                </li>
                <li>Under Test users, click + Add users, paste, and click Save.</li>
                <li>People drop off this list once they connect their Fitbit.</li>
              </ol>
              <button type="button" className={SECONDARY_BUTTON} onClick={() => load()}>
                Refresh
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
