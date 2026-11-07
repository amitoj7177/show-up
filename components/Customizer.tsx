"use client";

import { useState } from "react";
import { CHOICES, encodeAvatar, MOOD_BACKGROUND, parseAvatar, randomAvatar, type ChoiceKey } from "@/lib/avatar";
import { MASCOT_MOODS, type MascotMood } from "@/lib/rules";
import { PixelAvatar } from "./PixelAvatar";
import { SECONDARY_BUTTON } from "./Shared";

// The customize menu. Every choice is a real radio button, so it works with a keyboard and screen reader.
export function Customizer({ code, onChange }: { code: string; onChange: (code: string) => void }) {
  const [section, setSection] = useState<ChoiceKey>("hair");
  const [mood, setMood] = useState<MascotMood>("happy");
  const choice = parseAvatar(code);
  const active = CHOICES.find((option) => option.key === section) ?? CHOICES[0];
  const withOption = (index: number) => encodeAvatar({ ...choice, [section]: index });

  return (
    <div className="space-y-4">
      <div className="flex justify-center rounded-3xl py-5 transition-colors" style={{ background: MOOD_BACKGROUND[mood] }}>
        <PixelAvatar code={code} mood={mood} scale={4} animate label={`Your character, looking ${mood}.`} />
      </div>

      <fieldset>
        <legend className="mb-2 font-semibold">See every mood</legend>
        <div className="flex flex-wrap gap-2">
          {MASCOT_MOODS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mood === option}
              onClick={() => setMood(option)}
              className={`min-h-11 rounded-full px-3 font-semibold capitalize ${mood === option ? "bg-ink text-white" : "bg-accent-soft text-accent-dark"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <div role="group" aria-label="Choose what to change" className="flex flex-wrap gap-2 border-t border-line pt-4">
        {CHOICES.map((option) => (
          <button
            key={option.key}
            type="button"
            aria-pressed={section === option.key}
            onClick={() => setSection(option.key)}
            className={`min-h-11 rounded-full px-3 font-semibold ${section === option.key ? "bg-accent text-white" : "bg-accent-soft text-accent-dark"}`}
          >
            {option.title}
          </button>
        ))}
      </div>

      <fieldset>
        <legend className="mb-3 font-bold">
          {active.title}: <span className="font-medium">{active.options[choice[section]].name}</span>
        </legend>

        {active.kind === "tile" ? (
          <div className="grid grid-cols-3 gap-2">
            {active.options.map((option, index) => (
              <label
                key={option.name}
                className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-line bg-card p-2 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
              >
                <input
                  type="radio"
                  name={section}
                  className="sr-only"
                  checked={choice[section] === index}
                  onChange={() => onChange(withOption(index))}
                />
                <PixelAvatar code={withOption(index)} mood="waiting" scale={2} />
                <span className="mt-1 text-center font-medium">{option.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {active.options.map((option, index) => (
              <label
                key={option.name}
                title={option.name}
                className="flex size-14 cursor-pointer items-center justify-center rounded-2xl border-2 border-ink/25 has-checked:border-4 has-checked:border-ink has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                style={{ background: option.colour }}
              >
                <input
                  type="radio"
                  name={section}
                  aria-label={option.name}
                  className="sr-only"
                  checked={choice[section] === index}
                  onChange={() => onChange(withOption(index))}
                />
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <button type="button" className={SECONDARY_BUTTON} onClick={() => onChange(randomAvatar())}>
        Surprise me
      </button>
    </div>
  );
}
