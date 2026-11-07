"use client";

import { useState, type ReactNode } from "react";
import { MOOD_BACKGROUND } from "@/lib/avatar";
import type { DayMark } from "@/lib/rules";
import type { Act, Config, Today } from "@/lib/types";
import { MascotScreen } from "./MascotScreen";
import { PartnerScreen } from "./PartnerScreen";
import { PixelAvatar } from "./PixelAvatar";
import { Card, DemoLabel, ErrorNote, PRIMARY_BUTTON, SECONDARY_BUTTON, SupportFooter, WhyPanel, Wordmark } from "./Shared";

type Tab = "today" | "partner" | "mascot";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "partner", label: "Partner" },
  { id: "mascot", label: "Character" },
];

function partnerStatusText(partner: NonNullable<Today["partner"]>): string {
  if (partner.checkinToday === "done") return `${partner.nickname} checked in today.`;
  if (partner.checkinToday === "rough") return `${partner.nickname} is having a rough day.`;
  if (partner.silentDays > 0) return `${partner.nickname} has been quiet for ${partner.silentDays} day${partner.silentDays === 1 ? "" : "s"}.`;
  return `${partner.nickname} hasn't checked in yet today.`;
}

// Turns "08:00" into "8:00 AM".
function friendlyTime(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

// The week at a glance. Every mark also has words, so it never relies on colour.
const MARKS: Record<DayMark, { symbol: string; words: string; style: string }> = {
  done: { symbol: "✓", words: "done", style: "bg-accent text-white" },
  rough: { symbol: "~", words: "rough day", style: "bg-[#ffc4dc] text-ink" },
  missed: { symbol: "×", words: "missed", style: "bg-[#f7a58f] text-ink" },
  open: { symbol: "", words: "not yet", style: "bg-paper text-muted" },
};

function WeekGrid({ week }: { week: NonNullable<Today["pair"]>["week"] }) {
  const dayLetter = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "narrow", timeZone: "UTC" });
  const row = (label: string, who: "me" | "partner") => (
    <tr>
      <th scope="row" className="pr-2 text-left font-semibold">
        {label}
      </th>
      {week.map((day) => (
        <td key={day.date} className="p-0.5">
          <span className={`flex aspect-square w-full items-center justify-center rounded-lg font-bold ${MARKS[day[who]].style}`}>
            <span aria-hidden="true">{MARKS[day[who]].symbol}</span>
            <span className="sr-only">{MARKS[day[who]].words}</span>
          </span>
        </td>
      ))}
    </tr>
  );

  return (
    <table className="w-full table-fixed border-separate border-spacing-0">
      <caption className="sr-only">This week's check-ins</caption>
      <colgroup>
        <col className="w-20" />
      </colgroup>
      <thead>
        <tr>
          <td />
          {week.map((day) => (
            <th key={day.date} scope="col" aria-current={day.isToday ? "date" : undefined} className={`pb-1 text-center font-semibold ${day.isToday ? "text-accent-dark underline underline-offset-4" : "text-muted"}`}>
              {dayLetter(day.date)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {row("You", "me")}
        {row("Partner", "partner")}
      </tbody>
    </table>
  );
}

// Screen 2 (Today), Screen 3 (Partner) and the customize menu (Character).
export function TodayScreen({
  today,
  config,
  act,
  error,
  demoLabel,
  demoControls,
}: {
  today: Today;
  config: Config | null;
  act: Act;
  error: string;
  demoLabel?: string;
  demoControls?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const { partner, pair, mascot, me } = today;
  if (!partner || !pair) return null;

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <Wordmark />
        <p className="rounded-full bg-card px-3 py-1 font-semibold shadow-sm">Day {pair.dayOfWeek} of 7</p>
      </header>

      {demoLabel && <DemoLabel text={demoLabel} />}
      {today.notice && <ErrorNote message={today.notice} />}

      {tab === "today" && (
        <div className="rise-in space-y-4">
          <h1 className="sr-only">Today</h1>
          <section aria-label="You and your partner" className="overflow-hidden rounded-3xl transition-colors" style={{ background: MOOD_BACKGROUND[mascot.mood] }}>
            <div className="p-4 pb-0">
              <p className="rounded-2xl bg-white p-4 text-xl leading-snug font-bold shadow-sm">{mascot.message}</p>
            </div>
            <div className="flex items-end justify-around px-2 pt-3 pb-3">
              <figure className="flex flex-col items-center">
                <PixelAvatar code={me.avatar} mood={mascot.mood} scale={4} animate label={mascot.screenReaderText} />
                <figcaption className="font-bold">You</figcaption>
              </figure>
              <div className="mb-14 text-center">
                <p className="font-display text-5xl leading-none font-semibold">{pair.streak}</p>
                <p className="font-semibold">day streak</p>
              </div>
              <figure className="flex flex-col items-center">
                <PixelAvatar code={partner.avatar} mood={partner.mood} scale={3} label={`Your partner's character, looking ${partner.mood}.`} />
                <figcaption className="font-bold">Partner</figcaption>
              </figure>
            </div>
          </section>

          <Card>
            <h2 className="text-xl font-bold">{me.goal.text}</h2>
            <div className="grid gap-3">
              <button type="button" aria-pressed={today.today.myCheckin === "done"} className={PRIMARY_BUTTON} onClick={() => act("/api/checkin", { status: "done" })}>
                {today.today.myCheckin === "done" ? "Done today ✓" : "I did it"}
              </button>
              <button type="button" aria-pressed={today.today.myCheckin === "rough"} className={SECONDARY_BUTTON} onClick={() => act("/api/checkin", { status: "rough" })}>
                {today.today.myCheckin === "rough" ? "Rough day noted ✓" : "Rough day"}
              </button>
            </div>
            <p className="text-muted">Check in by {friendlyTime(me.checkInTime)}. A rough day keeps your streak safe.</p>
          </Card>

          <Card>
            <p aria-live="polite" className="font-semibold">
              {partnerStatusText(partner)}
            </p>
            {today.messagesReceived.map((message) => (
              <p key={message.id} className="rounded-2xl bg-accent-soft p-3 font-medium">
                “{message.text}”
              </p>
            ))}
            <button type="button" className={SECONDARY_BUTTON} onClick={() => setTab("partner")}>
              Send encouragement
            </button>
          </Card>

          <Card title="This week">
            <WeekGrid week={pair.week} />
          </Card>

          <WhyPanel why={me.why} />
        </div>
      )}

      {tab === "partner" && <PartnerScreen today={today} config={config} act={act} />}
      {tab === "mascot" && <MascotScreen today={today} act={act} />}

      {error && <ErrorNote message={error} />}
      {demoControls}

      <SupportFooter support={today.support} notMedicalCare={today.notMedicalCare} />

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card">
        <div className="mx-auto flex max-w-md gap-1 p-2">
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-current={tab === option.id ? "page" : undefined}
              onClick={() => {
                setTab(option.id);
                window.scrollTo(0, 0);
              }}
              className={`min-h-13 flex-1 rounded-2xl font-bold ${tab === option.id ? "bg-accent text-white" : "text-accent-dark"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
