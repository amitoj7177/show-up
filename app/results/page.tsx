"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Stats } from "@/lib/types";

// Real results from real people. Demo data is never counted.
export default function Results() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/stats")
      .then(setStats)
      .catch((problem) => setError(problem instanceof ApiError ? problem.message : "We couldn't load the results."));
  }, []);

  const rows: [string, number][] = stats
    ? [
        ["People who made a promise", stats.people],
        ["Partnerships formed", stats.pairs],
        ["Check-ins done", stats.doneCheckins],
        ["Rough days shared", stats.roughDays],
        ["Encouragements sent", stats.messagesSent],
        ["People who came back after day one", stats.cameBackAfterDayOne],
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-5 px-4 py-6">
      <h1 className="font-display text-xl leading-relaxed">Real results</h1>
      <p>Counted live from real use. Demo data is never included.</p>
      {error && (
        <p role="alert" className="border-[3px] border-ink bg-warn-soft p-4 font-medium">
          {error}
        </p>
      )}
      {!stats && !error && <p role="status">Loading...</p>}
      <dl className="grid gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-card p-4">
            <dt>{label}</dt>
            <dd className="font-display text-xl">{value}</dd>
          </div>
        ))}
      </dl>
      <a href="/" className="px-link">
        Back to Promise Pals
      </a>
    </main>
  );
}
