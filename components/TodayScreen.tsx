"use client";

import { scrollPhoneToTop } from "./PhoneFrame";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MOOD_BACKGROUND } from "@/lib/avatar";
import type { DayMark } from "@/lib/rules";
import type { Act, Config, History, Today } from "@/lib/types";
import { MascotScreen } from "./MascotScreen";
import { clockTime, presenceText, useLinePicker } from "./Moments";
import { FitbitNudge } from "./FitbitCard";
import { PartnerCard } from "./PartnerCard";
import { PhotoButton, PrivatePhoto } from "./Photos";
import { PartnerScreen } from "./PartnerScreen";
import { ProgressScreen } from "./ProgressScreen";
import { PixelAvatar } from "./PixelAvatar";
import { Card, DemoLabel, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, WhyPanel, Wordmark } from "./Shared";

type Tab = "today" | "partner" | "progress" | "mascot";

// Simple line icons for the tab bar.
const ICONS: Record<Tab, string> = {
  today: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z",
  partner: "M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zM2 20c0-3 3-5 6-5s6 2 6 5M14 15.5c.6-.3 1.3-.5 2-.5 3 0 6 2 6 5",
  progress: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  mascot: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "partner", label: "Partner" },
  { id: "progress", label: "Progress" },
  { id: "mascot", label: "Me" },
];

function partnerStatusText(partner: NonNullable<Today["partner"]>): string {
  const at = partner.checkedInAt ? ` at ${clockTime(partner.checkedInAt)}` : " today";
  if (partner.checkinToday === "done") return `${partner.nickname} checked in${at}.`;
  if (partner.checkinToday === "rough") return `${partner.nickname} skipped today${partner.checkedInAt ? `, at ${clockTime(partner.checkedInAt)}` : ""}.`;
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
          <span className={`flex aspect-square w-full items-center justify-center border border-line rounded-md font-bold ${MARKS[day[who]].style}`}>
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

// Your proof for today, and whether your partner has confirmed it.
function MyProof({ today, partnerName }: { today: Today; partnerName: string }) {
  const proof = today.today.proof;
  return (
    <div className="space-y-2">
      <p className="font-bold border border-line rounded-2xl bg-[#8fd37f] p-3 text-center">Checked in ✓</p>
      {proof?.photoId && (
        <PrivatePhoto kind="proof" id={proof.photoId} alt={proof.note ? `Your proof photo: ${proof.note}` : "Your proof photo"} className="aspect-[4/3] w-full border border-line rounded-2xl" />
      )}
      {proof?.note && <p className="text-muted">Photo checked: {proof.note}</p>}
      {typeof proof?.fitbitSteps === "number" && <p className="font-semibold">Fitbit: {proof.fitbitSteps.toLocaleString("en-CA")} steps today</p>}
      <p className="font-semibold">
        {proof?.confirmedAt
          ? `\u2705 ${partnerName} confirmed it at ${clockTime(proof.confirmedAt)}`
          : proof?.photoId
            ? `Waiting for ${partnerName} to confirm your photo.`
            : `No photo today, so ${partnerName} can't confirm it.`}
      </p>
    </div>
  );
}

// Your partner's proof, with a button to confirm you believe them.
function PartnerProof({ partner, act }: { partner: NonNullable<Today["partner"]>; act: Act }) {
  const proof = partner.proof;
  if (!proof) return null;
  return (
    <div className="space-y-2">
      {proof.photoId ? (
        <PrivatePhoto kind="proof" id={proof.photoId} alt={proof.note ? `${partner.nickname}'s proof photo: ${proof.note}` : `${partner.nickname}'s proof photo`} className="aspect-[4/3] w-full border border-line rounded-2xl" />
      ) : (
        <p className="text-muted">{partner.nickname} checked in without a photo.</p>
      )}
      {proof.note && <p className="text-muted">Photo checked: {proof.note}</p>}
      {typeof proof.fitbitSteps === "number" && (
        <p className="font-semibold">Fitbit: {proof.fitbitSteps.toLocaleString("en-CA")} steps today</p>
      )}
      {proof.confirmedAt ? (
        <p className="font-semibold">{"\u2705"} You confirmed it at {clockTime(proof.confirmedAt)}.</p>
      ) : !proof.photoId ? null : (
        <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/confirm")}>
          Confirm {partner.nickname} did it
        </button>
      )}
    </div>
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
  sampleHistory,
}: {
  today: Today;
  config: Config | null;
  act: Act;
  error: string;
  onLogOut?: () => void;
  demoLabel?: string;
  demoControls?: ReactNode;
  sampleHistory?: History;
}) {
  const [tab, setTab] = useState<Tab>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has("fitbit") ? "mascot" : "today",
  );
  const [saying, setSaying] = useState("");
  const [waveFrame, setWaveFrame] = useState(0);
  const [checkingPhoto, setCheckingPhoto] = useState(false);
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

  async function checkIn(photo?: string) {
    setCheckingPhoto(Boolean(photo));
    await act("/api/checkin", photo ? { status: "done", photo } : { status: "done" });
    setCheckingPhoto(false);
    say(pick("checkin", config?.talk.checkin));
  }

  async function skip() {
    await act("/api/checkin", { status: "rough" });
    say(pick("skip", config?.talk.skip));
  }

  return (
    <div className="tab-bar-space space-y-4">
      <header className="flex items-center justify-between">
        <Wordmark />
        <p className="border border-line bg-card px-2 py-1 font-semibold">Day {pair.dayOfWeek} of 7</p>
      </header>
      {me.group && <p className="font-semibold">With {me.group}</p>}

      {demoLabel && <DemoLabel text={demoLabel} />}
      {today.notice && <ErrorNote message={today.notice} />}

      {tab === "today" && (
        <div className="space-y-4">
          <h1 className="sr-only">Today</h1>
          <section aria-label="You and your partner" className="overflow-hidden border border-line rounded-2xl shadow-sm" style={{ background: MOOD_BACKGROUND[mascot.mood] }}>
            <div className="p-3 pb-0">
              <p role="status" className="border border-line rounded-2xl bg-white p-3 text-lg leading-snug font-bold">
                {saying || mascot.message}
              </p>
            </div>
            <div className="flex items-end justify-evenly px-2 pt-3 pb-3">
              <button type="button" onClick={pepTalk} aria-label="Tap your character for a pep talk" className="press flex flex-col items-center">
                <PixelAvatar code={me.avatar} mood={mascot.mood} scale={4} animate={!waveFrame} wave={waveFrame} label={mascot.screenReaderText} />
                <span className="mt-1 text-lg font-semibold">You</span>
              </button>
              <figure className="flex flex-col items-center">
                <PixelAvatar code={partner.avatar} mood={partner.mood} scale={4} label={`Your partner's character, looking ${partner.mood}.`} />
                <figcaption className="mt-1 text-lg font-semibold break-all">{partner.nickname}</figcaption>
                <p className="mt-1 flex items-center gap-1.5 font-semibold">
                  <span aria-hidden="true" className={`inline-block size-3 border border-line rounded-md ${partner.activeNow ? "bg-[#43a047]" : "bg-white"}`} />
                  {presenceText(partner)}
                </p>
              </figure>
            </div>
            <p className="border-t border-line bg-white px-3 py-2 text-center font-semibold">
              <span className="font-bold">{pair.streak}</span> day streak together · Tap yourself for a pep talk
            </p>
          </section>

          <Card>
            <h2 className="text-xl font-bold">{me.goal.text}</h2>
            {checkedIn ? (
              <MyProof today={today} partnerName={partner.nickname} />
            ) : (
              <>
                <PhotoButton
                  label={checkingPhoto ? "Checking your photo..." : "Check in with a photo"}
                  className={`${PRIMARY_BUTTON} py-5 text-lg`}
                  disabled={checkingPhoto}
                  onPhoto={(photo) => checkIn(photo)}
                />
                <p className="text-muted">A photo of what you did is your proof. {partner.nickname} will confirm it.</p>
                {!today.isDemo && <FitbitNudge onOpen={() => setTab("mascot")} />}
                <button type="button" className={SECONDARY_BUTTON} disabled={checkingPhoto} onClick={() => checkIn()}>
                  Check in without a photo
                </button>
                {!skipped && (
                  <button type="button" className={QUIET_BUTTON} onClick={skip}>
                    Skip today
                  </button>
                )}
              </>
            )}
            <p className="text-muted">
              {skipped ? "Skipped today. Your streak is safe." : `Check in by ${friendlyTime(me.checkInTime)}. Skipping keeps your streak safe.`}
            </p>
            {today.today.myCheckin && (
              <p className="font-semibold">
                {today.today.seenByPartnerAt
                  ? `✓✓ Seen by ${partner.nickname} at ${clockTime(today.today.seenByPartnerAt)}`
                  : `✓ Sent to ${partner.nickname}. Not seen yet.`}
              </p>
            )}
          </Card>

          <Card>
            <PartnerCard partner={partner} />
            <p aria-live="polite" className="font-semibold">
              {partnerStatusText(partner)}
            </p>
            {partner.checkinToday === "done" && <PartnerProof partner={partner} act={act} />}
            {today.messagesReceived.map((message) => (
              <p key={message.id} className="border border-line rounded-2xl bg-accent-soft p-3 font-medium">
                “{message.text}”
              </p>
            ))}
            <button type="button" className={SECONDARY_BUTTON} onClick={() => setTab("partner")}>
              Send encouragement
            </button>
          </Card>

          {pair.meetSpot && (
            <Card title="Meet up this week?">
              <p>
                <strong>{pair.meetSpot.name}</strong> is a public {pair.meetSpot.type.toLowerCase()} about halfway between you and{" "}
                {partner.nickname}
                {partner.communityName ? ` in ${partner.communityName}` : ""}.
              </p>
              <p className="text-muted">{pair.meetSpot.address}</p>
              <a href={pair.meetSpot.mapUrl} className={SECONDARY_BUTTON} target="_blank" rel="noreferrer">
                Open in Maps
              </a>
              <p className="text-muted">Optional. Meet in public, and only if you both want to. Place from {pair.meetSpot.source}.</p>
            </Card>
          )}

          <Card title="This week">
            <WeekGrid week={pair.week} />
          </Card>

          <WhyPanel why={me.why} />
        </div>
      )}

      {tab === "partner" && <PartnerScreen today={today} config={config} act={act} />}
      {tab === "progress" && <ProgressScreen today={today} config={config} act={act} sample={sampleHistory} />}
      {tab === "mascot" && <MascotScreen today={today} act={act} onLogOut={onLogOut} />}

      {error && <ErrorNote message={error} />}
      {demoControls}


      <nav aria-label="Main" className="tab-bar fixed inset-x-0 bottom-0 z-10 w-full border-t border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md">
          {TABS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-current={tab === option.id ? "page" : undefined}
              onClick={() => {
                setTab(option.id);
                scrollPhoneToTop();
              }}
              className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 font-semibold ${tab === option.id ? "text-accent" : "text-muted"}`}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[option.id]} />
              </svg>
              <span className="text-[15px]">{option.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
