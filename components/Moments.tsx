"use client";

import { useRef } from "react";
import type { MascotMood } from "@/lib/rules";
import type { Today } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";
import { ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, TitleBar } from "./Shared";

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
      <figcaption className="font-display mt-1 text-xs break-all">{name}</figcaption>
    </figure>
  );
}

// While we look for a partner: you, and a mystery box.
export function FindingScreen({ today, onCancel }: { today: Today; onCancel: () => void }) {
  return (
    <div className="px-card overflow-hidden">
      <TitleBar title="Find a partner" />
      <div className="flex min-h-72 items-end justify-evenly border-b-4 border-ink bg-[#bfe6ff] px-2 pt-14">
        <Character code={today.me.avatar} mood="waiting" name="YOU" label={today.mascot.screenReaderText} />
        <div aria-hidden="true" className="font-display mb-9 flex h-52 w-34 items-center justify-center border-4 border-dashed border-ink text-4xl">
          ?
        </div>
      </div>
      <div className="space-y-4 p-5 text-center">
        <h1 aria-live="polite" className="font-display text-lg leading-relaxed">
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
      <div className="flex min-h-72 items-end justify-evenly border-b-4 border-ink bg-[#bfe6ff] px-2 pt-14">
        <Character className="slide-in-left" code={today.me.avatar} mood="happy" name="YOU" label="Your character, looking happy." />
        <Character
          className="slide-in-right"
          code={today.partner.avatar}
          mood="caring"
          name={today.partner.nickname.toUpperCase()}
          label="Your new partner's character, with little hearts."
        />
      </div>
      <div className="space-y-4 p-5 text-center">
        <div role="status">
          <h1 className="font-display pop-in text-lg leading-relaxed">You&apos;re a team!</h1>
        </div>
        <p>{line}</p>
        <p className="text-muted">
          Your partner is {today.partner.nickname}. Their goal: {today.partner.goal ?? today.partner.goalTypeLabel}.
        </p>
        <button type="button" className={PRIMARY_BUTTON} onClick={onContinue}>
          Go to Today
        </button>
      </div>
    </div>
  );
}
