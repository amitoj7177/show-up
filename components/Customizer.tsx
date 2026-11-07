"use client";

import { useState } from "react";
import { CHOICES, encodeAvatar, MOOD_BACKGROUND, parseAvatar, randomAvatar, type ChoiceKey } from "@/lib/avatar";
import { ALL_MOODS, type MascotMood } from "@/lib/rules";
import { PixelAvatar } from "./PixelAvatar";
import { SECONDARY_BUTTON } from "./Shared";

// The customize menu from the Promise Pals design: one row per choice, with left and right arrows.
export function Customizer({ code, onChange, showMoods = false }: { code: string; onChange: (code: string) => void; showMoods?: boolean }) {
  const [mood, setMood] = useState<MascotMood>("happy");
  const choice = parseAvatar(code);

  function step(key: ChoiceKey, amount: number, count: number) {
    onChange(encodeAvatar({ ...choice, [key]: (choice[key] + amount + count) % count }));
  }

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
            </div>
          );
        })}
      </div>

      <button type="button" className={SECONDARY_BUTTON} onClick={() => onChange(randomAvatar())}>
        Shuffle
      </button>
    </div>
  );
}
