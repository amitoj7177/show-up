"use client";

import { useEffect, useRef, useState } from "react";
import type { Act, Today } from "@/lib/types";
import { Customizer } from "./Customizer";
import { Card, SECONDARY_BUTTON } from "./Shared";

// The customize menu inside the app. Your partner sees your changes within a few seconds.
export function MascotScreen({ today, act, onLogOut }: { today: Today; act: Act; onLogOut?: () => void }) {
  const [code, setCode] = useState(today.me.avatar);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Save shortly after the last change, so clicking around doesn't send lots of requests.
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function change(next: string) {
    setCode(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => act("/api/settings", { avatar: next }), 400);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-base leading-relaxed">Your avatar</h1>
      <p>This is who your partner sees. Changes save by themselves.</p>
      <Card>
        <Customizer code={code} onChange={change} showMoods />
      </Card>
      <Card title="Reactions">
        <label className="flex min-h-12 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={today.me.gentleMascot}
            onChange={(event) => act("/api/settings", { gentleMascot: event.target.checked })}
            className="size-6 shrink-0 accent-ink"
          />
          <span>
            <span className="block font-bold">Gentle mode</span>
            <span className="text-muted">Your avatar never gets angry with you.</span>
          </span>
        </label>
      </Card>
      {onLogOut && (
        <button type="button" className={SECONDARY_BUTTON} onClick={onLogOut}>
          Log out
        </button>
      )}
    </div>
  );
}
