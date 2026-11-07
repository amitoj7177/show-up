"use client";

import { useEffect, useState, type FormEvent } from "react";
import { PixelAvatar } from "@/components/PixelAvatar";
import { Card, DemoLabel, ErrorNote, PRIMARY_BUTTON, TitleBar } from "@/components/Shared";
import { api, ApiError } from "@/lib/api";
import type { GroupTotals } from "@/lib/groups";
import { addDays, todayIn } from "@/lib/rules";

// Labelled sample numbers, for showing the screen without a real clinic.
function sampleTotals(): GroupTotals {
  const today = todayIn(new Date());
  const done = [9, 11, 10, 12, 8, 13, 11];
  const skipped = [2, 1, 3, 1, 2, 0, 2];
  return {
    name: "Demo Physio Clinic",
    joinCode: "DEMO42",
    people: 16,
    enoughPeople: true,
    minimumPeople: 5,
    week: {
      checkInRate: 66,
      doneDays: 74,
      skippedDays: 11,
      pairedNow: 14,
      cameBackAfterDayOne: 13,
      days: done.map((count, index) => ({ date: addDays(today, index - 6), done: count, skipped: skipped[index] })),
    },
  };
}

function Totals({ totals }: { totals: GroupTotals }) {
  const dayName = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "short", timeZone: "UTC" });

  if (!totals.enoughPeople || !totals.week) {
    return (
      <Card title="Not enough people yet">
        <p>
          {totals.people} {totals.people === 1 ? "person has" : "people have"} joined. Totals appear once {totals.minimumPeople} people have joined, so
          nobody can be singled out.
        </p>
        <p className="font-semibold">Share this join code: {totals.joinCode}</p>
      </Card>
    );
  }

  const { week } = totals;
  const tiles: [string, string][] = [
    ["Checked in this week", `${week.checkInRate}%`],
    ["People who joined", String(totals.people)],
    ["Paired right now", String(week.pairedNow)],
    ["Came back after day one", String(week.cameBackAfterDayOne)],
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="px-card p-3">
            <dt className="text-muted">{label}</dt>
            <dd className="mt-2 text-3xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <Card title="The last 7 days">
        <table className="w-full text-left">
          <caption className="sr-only">Check-ins and skipped days, each day this week</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="py-1">
                Day
              </th>
              <th scope="col" className="py-1 text-right">
                Checked in
              </th>
              <th scope="col" className="py-1 text-right">
                Skipped
              </th>
            </tr>
          </thead>
          <tbody>
            {week.days.map((day) => (
              <tr key={day.date} className="border-b border-line">
                <th scope="row" className="py-1 font-medium">
                  {dayName(day.date)}
                </th>
                <td className="py-1 text-right">{day.done}</td>
                <td className="py-1 text-right">{day.skipped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-muted">Join code for new patients: {totals.joinCode}</p>
    </div>
  );
}

// The clinic staff screen: anonymous totals only. Never names, goals or anything about one person.
export default function ClinicPage() {
  const [demo, setDemo] = useState(false);
  const [staffKey, setStaffKey] = useState("");
  const [totals, setTotals] = useState<GroupTotals | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      setDemo(true);
      setTotals(sampleTotals());
    }
  }, []);

  async function open(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setTotals(await api<GroupTotals>("/api/clinic", { body: { staffKey } }));
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
      <div className="px-card overflow-hidden">
        <TitleBar title={totals ? totals.name : "For clinics"} />
        <div className="space-y-4 p-5">
          {demo && <DemoLabel text="Demo: sample numbers, not a real clinic" />}
          <div className="flex items-center gap-3">
            <div className="shrink-0 border border-line rounded-2xl bg-[#ffe58a] p-1">
              <PixelAvatar code="h1-c2-s3-e2-o2-k7-a1" mood="proud" scale={2} />
            </div>
            <p>See how your patients are doing, together. You only ever see totals, never names or goals.</p>
          </div>

          {!totals && (
            <form onSubmit={open} className="space-y-4">
              <div>
                <label htmlFor="staff-key" className="px-label">
                  Staff key
                </label>
                <input
                  id="staff-key"
                  className="px-input"
                  type="password"
                  required
                  value={staffKey}
                  onChange={(event) => setStaffKey(event.target.value)}
                  autoComplete="off"
                />
              </div>
              {error && <ErrorNote message={error} />}
              <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
                {busy ? "Checking..." : "Open dashboard"}
              </button>
              <a href="/clinic?demo=1" className="px-link block text-center">
                See a demo with sample numbers
              </a>
            </form>
          )}

          {totals && <Totals totals={totals} />}
        </div>
      </div>
      <a href="/" className="px-link mt-4 block text-center">
        Back to Promise Pals
      </a>
    </main>
  );
}
