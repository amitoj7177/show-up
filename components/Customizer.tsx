"use client";

import { useRef, useState } from "react";
import { CHOICES, encodeAvatar, MOOD_BACKGROUND, parseAvatar, randomAvatar, type ChoiceKey } from "@/lib/avatar";
import { ALL_MOODS, EXTRA_UNLOCKS, extraLocked, type MascotMood } from "@/lib/rules";
import { PixelAvatar } from "./PixelAvatar";
import { SECONDARY_BUTTON } from "./Shared";

export function Customizer({
  code,
  onChange,
  showMoods = false,
  points = 0,
}: {
  code: string;
  onChange: (code: string) => void;
  showMoods?: boolean;
  points?: number;
}) {
  const [mood, setMood] = useState<MascotMood>("happy");
  const worn = useRef(parseAvatar(code).acc);
  const choice = parseAvatar(code);
  const available = (key: ChoiceKey, option: number) => key !== "acc" || option === worn.current || !extraLocked(option, points);

  function step(key: ChoiceKey, amount: number, count: number) {
    let next = choice[key];
    do next = (next + amount + count) % count;
    while (!available(key, next));
    onChange(encodeAvatar({ ...choice, [key]: next }));
  }

  function shuffle() {
    const next = parseAvatar(randomAvatar());
    if (!available("acc", next.acc)) next.acc = 0;
    onChange(encodeAvatar(next));
  }

  const locked = Object.entries(EXTRA_UNLOCKS).filter(([extra]) => !available("acc", Number(extra)));

  return (
    <div className="space-y-4">
      <div className="relative flex h-72 items-end justify-center overflow-hidden border border-line rounded-2xl" style={{ background: MOOD_BACKGROUND[mood] }}>
        <div aria-hidden="true" className="absolute top-1/2 left-1/2 size-56 -translate-x-1/2 -translate-y-[46%] rounded-full bg-white/50" />
        <div className="relative mb-1">
          <PixelAvatar code={code} mood={mood} scale={5} animate label={`Your character, looking ${mood}.`} />
        </div>
      </div>

      {showMoods && (
        <div role="group" aria-label="Preview a mood" className="flex flex-wrap gap-2">
          {ALL_MOODS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mood === option}
              onClick={() => setMood(option)}
              className={`min-h-11 border border-line rounded-2xl px-3 font-semibold capitalize ${mood === option ? "bg-accent text-white" : "bg-white"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {CHOICES.map(({ key, title, options }) => {
          const current = options[choice[key]];
          return (
            <div key={key}>
              <p id={`label-${key}`} className="px-label">
                {title}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Previous ${title}`}
                  onClick={() => step(key, -1, options.length)}
                  className="font-bold size-12 shrink-0 border border-line rounded-2xl bg-white"
                >
                  <span aria-hidden="true">&lt;</span>
                </button>
                <p aria-live="polite" aria-labelledby={`label-${key}`} className="flex min-w-0 flex-1 items-center justify-center gap-2 text-center font-medium">
                  {current.colour && <span aria-hidden="true" className="inline-block size-5 shrink-0 border border-line rounded-md" style={{ background: current.colour }} />}
                  {current.name}
                </p>
                <button
                  type="button"
                  aria-label={`Next ${title}`}
                  onClick={() => step(key, 1, options.length)}
                  className="font-bold size-12 shrink-0 border border-line rounded-2xl bg-white"
                >
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
              {key === "acc" && locked.length > 0 && (
                <p className="mt-1 text-muted">
                  {"\u{1F512}"} Earn points to unlock: {locked.map(([extra, needed]) => `${options[Number(extra)].name} (${needed})`).join(", ")}. You have {points}.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className={SECONDARY_BUTTON} onClick={shuffle}>
        Shuffle
      </button>
    </div>
  );
}
