"use client";

import { useRef } from "react";
import type { MascotMood } from "@/lib/rules";
import type { Today } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";
import { PartnerCard } from "./PartnerCard";
import { ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, TitleBar } from "./Shared";

// "7:42 AM", in Calgary time.
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Edmonton" });
}

// "Active now", or "Last active 2 hours ago", from when they really last opened the app.
export function presenceText(partner: NonNullable<Today["partner"]>): string {
  if (partner.activeNow) return "Active now";
  if (!partner.lastActiveAt) return "";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(partner.lastActiveAt).getTime()) / 60_000));
  if (minutes < 60) return `Last active ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last active ${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `Last active ${days} day${days === 1 ? "" : "s"} ago`;
}

// Picks a random line, never the same one twice in a row.
export function useLinePicker() {
  const last = useRef<Record<string, number>>({});
  return (key: string, lines: string[] | undefined): string => {
    if (!lines?.length) return "";
    let index = 0;
    do {
      index = Math.floor(Math.random() * lines.length);
    } while (lines.length > 1 && index === last.current[key]);
    last.current[key] = index;
    return lines[index];
  };
}

function Character({ code, mood, name, label, className = "" }: { code: string; mood: MascotMood; name: string; label: string; className?: string }) {
  return (
    <figure className={`text-center ${className}`}>
      <PixelAvatar code={code} mood={mood} scale={4} label={label} />
      <figcaption className="mt-1 text-lg font-semibold break-all">{name}</figcaption>
    </figure>
  );
}

// While we look for a partner: you, and a mystery box.
export function FindingScreen({ today, onCancel }: { today: Today; onCancel: () => void }) {
  return (
    <div className="px-card overflow-hidden">
      <TitleBar title="Find a partner" />
      <div className="flex min-h-72 items-end justify-evenly border-b border-line bg-[#bfe6ff] px-2 pt-14">
        <Character code={today.me.avatar} mood="waiting" name="You" label={today.mascot.screenReaderText} />
        <div aria-hidden="true" className="font-bold mb-9 flex h-52 w-34 items-center justify-center border-2 border-dashed border-line rounded-3xl text-4xl">
          ?
        </div>
      </div>
      <div className="space-y-4 p-5 text-center">
        <h1 aria-live="polite" className="text-2xl font-bold leading-tight">
          Looking<span className="typing-dots">...</span>
        </h1>
        <p>Hang tight while we find someone to cheer you on.</p>
        {today.notice && <ErrorNote message={today.notice} />}
        <p className="text-muted">
          You&apos;re {today.me.nickname}. We look for someone with a similar goal first.
        </p>
        <button type="button" className={QUIET_BUTTON} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// The moment you're matched: both characters slide in.
export function PartnerFoundScreen({ today, line, onContinue }: { today: Today; line: string; onContinue: () => void }) {
  if (!today.partner) return null;
  return (
    <div className="px-card overflow-hidden">
      <TitleBar title="Partner found!" />
      <div className="flex min-h-72 items-end justify-evenly border-b border-line bg-[#bfe6ff] px-2 pt-14">
        <Character className="slide-in-left" code={today.me.avatar} mood="happy" name="You" label="Your character, looking happy." />
        <Character
          className="slide-in-right"
          code={today.partner.avatar}
          mood="caring"
          name={today.partner.nickname}
          label="Your new partner's character, with little hearts."
        />
      </div>
      <div className="space-y-4 p-5 text-center">
        <div role="status">
          <h1 className="pop-in text-2xl font-bold leading-tight">You&apos;re a team!</h1>
        </div>
        <p>{line}</p>
        <div className="text-left">
          <PartnerCard partner={today.partner} />
        </div>
        <button type="button" className={PRIMARY_BUTTON} onClick={onContinue}>
          Go to Today
        </button>
      </div>
    </div>
  );
}
