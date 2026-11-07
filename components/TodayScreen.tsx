"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MOOD_BACKGROUND } from "@/lib/avatar";
import type { DayMark } from "@/lib/rules";
import type { Act, Config, Today } from "@/lib/types";
import { MascotScreen } from "./MascotScreen";
import { useLinePicker } from "./Moments";
import { PartnerScreen } from "./PartnerScreen";
import { PixelAvatar } from "./PixelAvatar";
import { Card, DemoLabel, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, SupportFooter, WhyPanel, Wordmark } from "./Shared";

type Tab = "today" | "partner" | "mascot";

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "partner", label: "Partner" },
  { id: "mascot", label: "Avatar" },
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
  done: { symbol: "✓", words: "done", style: "bg-ink text-white" },
  rough: { symbol: "~", words: "skipped", style: "bg-[#cfe0f5] text-ink" },
  missed: { symbol: "×", words: "missed", style: "bg-[#f7a58f] text-ink" },
  open: { symbol: "", words: "not yet", style: "bg-white text-muted" },
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
          <span className={`flex aspect-square w-full items-center justify-center border-2 border-ink font-bold ${MARKS[day[who]].style}`}>
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
            <th key={day.date} scope="col" aria-current={day.isToday ? "date" : undefined} className={`pb-1 text-center font-semibold ${day.isToday ? "underline underline-offset-4" : "text-muted"}`}>
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
  onLogOut,
  demoLabel,
  demoControls,
}: {
  today: Today;
  config: Config | null;
  act: Act;
  error: string;
  onLogOut?: () => void;
  demoLabel?: string;
  demoControls?: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("today");
  const [saying, setSaying] = useState("");
  const [waveFrame, setWaveFrame] = useState(0);
  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pick = useLinePicker();
  const { partner, pair, mascot, me } = today;

  useEffect(() => () => clearTimeout(sayTimer.current), []);
  if (!partner || !pair) return null;

  const checkedIn = today.today.myCheckin === "done";
  const skipped = today.today.myCheckin === "rough";

  // Your character says something for 5 seconds, then goes back to its usual line.
  function say(line: string) {
    clearTimeout(sayTimer.current);
    setSaying(line);
    sayTimer.current = setTimeout(() => setSaying(""), 5000);
  }

  function pepTalk() {
    say(pick("motivation", config?.talk.motivation));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frames = 0;
    const timer = setInterval(() => {
      frames += 1;
      setWaveFrame(frames > 5 ? 0 : frames % 2 === 1 ? 1 : 2);
      if (frames > 5) clearInterval(timer);
    }, 200);
  }

  async function checkIn() {
    await act("/api/checkin", { status: "done" });
    say(pick("checkin", config?.talk.checkin));
  }

  async function skip() {
    await act("/api/checkin", { status: "rough" });
    say(pick("skip", config?.talk.skip));
  }

  return (
    <div className="space-y-4 pb-24">
      <header className="flex items-center justify-between">
        <Wordmark />
        <p className="border-[3px] border-ink bg-white px-2 py-1 font-semibold">Day {pair.dayOfWeek} of 7</p>
      </header>

      {demoLabel && <DemoLabel text={demoLabel} />}
      {today.notice && <ErrorNote message={today.notice} />}

      {tab === "today" && (
        <div className="space-y-4">
          <h1 className="sr-only">Today</h1>
          <section aria-label="You and your partner" className="overflow-hidden border-[3px] border-ink shadow-[0_4px_0_var(--color-ink)]" style={{ background: MOOD_BACKGROUND[mascot.mood] }}>
            <div className="p-3 pb-0">
              <p role="status" className="border-[3px] border-ink bg-white p-3 text-lg leading-snug font-bold">
                {saying || mascot.message}
              </p>
            </div>
            <div className="flex items-end justify-evenly px-2 pt-3 pb-3">
              <button type="button" onClick={pepTalk} aria-label="Tap your character for a pep talk" className="press flex flex-col items-center">
                <PixelAvatar code={me.avatar} mood={mascot.mood} scale={4} animate={!waveFrame} wave={waveFrame} label={mascot.screenReaderText} />
                <span className="font-display mt-1 text-xs">YOU</span>
              </button>
              <figure className="flex flex-col items-center">
                <PixelAvatar code={partner.avatar} mood={partner.mood} scale={4} label={`Your partner's character, looking ${partner.mood}.`} />
                <figcaption className="font-display mt-1 text-xs break-all">{partner.nickname.toUpperCase()}</figcaption>
              </figure>
            </div>
            <p className="border-t-[3px] border-ink bg-white px-3 py-2 text-center font-semibold">
              <span className="font-display">{pair.streak}</span> day streak together · Tap yourself for a pep talk
            </p>
          </section>

          <Card>
            <h2 className="text-xl font-bold">{me.goal.text}</h2>
            <button type="button" disabled={checkedIn} className={`${PRIMARY_BUTTON} py-5 text-lg`} onClick={checkIn}>
              {checkedIn ? "CHECKED IN ✓" : "CHECK IN"}
            </button>
            {!checkedIn && !skipped && (
              <button type="button" className={QUIET_BUTTON} onClick={skip}>
                Skip today
              </button>
            )}
            <p className="text-muted">
              {skipped ? "Skipped today. Your streak is safe." : `Check in by ${friendlyTime(me.checkInTime)}. Skipping keeps your streak safe.`}
            </p>
          </Card>

          <Card>
            <p aria-live="polite" className="font-semibold">
              {partnerStatusText(partner)}
            </p>
            {today.messagesReceived.map((message) => (
              <p key={message.id} className="border-[3px] border-ink bg-accent-soft p-3 font-medium">
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
      {tab === "mascot" && <MascotScreen today={today} act={act} onLogOut={onLogOut} />}

      {error && <ErrorNote message={error} />}
      {demoControls}

      <SupportFooter support={today.support} notMedicalCare={today.notMedicalCare} />

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 border-t-4 border-ink bg-[#ffd54f]">
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
              className={`min-h-13 flex-1 border-[3px] border-ink font-bold ${tab === option.id ? "bg-ink text-white" : "bg-white"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
