"use client";

import { useEffect, useState } from "react";
import { loadReading, READING_OPTIONS, saveReading, type ReadingSettings as Settings } from "@/lib/reading";

// Four switches that change how the whole app looks, straight away.
export function ReadingSettings() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => setSettings(loadReading()), []);

  function toggle(key: keyof Settings, value: string, on: boolean) {
    const next = { ...settings, [key]: on ? value : undefined };
    setSettings(next);
    saveReading(next);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Easy reading</legend>
      {READING_OPTIONS.map((option) => (
        <label key={option.key} className="flex min-h-12 cursor-pointer items-start gap-3 border border-line bg-white p-3 has-checked:bg-[#fffc00]">
          <input
            type="checkbox"
            checked={settings[option.key] === option.value}
            onChange={(event) => toggle(option.key, option.value, event.target.checked)}
            className="mt-1 size-6 shrink-0 accent-ink"
          />
          <span>
            <span className="block font-bold">{option.label}</span>
            <span className="text-muted">{option.hint}</span>
          </span>
        </label>
      ))}
      <p className="text-muted">Saved on this phone only.</p>
    </fieldset>
  );
}
