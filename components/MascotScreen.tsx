"use client";

import { useEffect, useRef, useState } from "react";
import type { Act, Today } from "@/lib/types";
import { Customizer } from "./Customizer";
import { FitbitCard } from "./FitbitCard";
import { ReadingSettings } from "./ReadingSettings";
import { ProfileForm } from "./ProfileForm";
import { api, ApiError, getToken } from "@/lib/api";
import { POINTS } from "@/lib/rules";
import { Card, ErrorNote, PRIMARY_BUTTON, SECONDARY_BUTTON } from "./Shared";

export function MascotScreen({ today, act, onLogOut }: { today: Today; act: Act; onLogOut?: () => void }) {
  const [code, setCode] = useState(today.me.avatar);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function change(next: string) {
    setCode(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => act("/api/settings", { avatar: next }), 400);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">You</h1>
      <Card title="Easy reading">
        <ReadingSettings />
      </Card>
      {!today.isDemo && <FitbitCard />}
      {!today.isDemo && (
        <Card title="Your profile">
          <ProfileForm submitLabel="Save profile" onSaved={() => undefined} />
        </Card>
      )}
      <h2 className="text-xl font-bold">Your character</h2>
      <p>This is who your partner sees. Changes save by themselves.</p>
      <PointsCard points={today.me.points} />
      <Card>
        <Customizer code={code} onChange={change} showMoods points={today.me.points} />
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
      {onLogOut && !today.isDemo && <DeleteAccount onDeleted={onLogOut} />}
      <a href="/privacy" className="px-link block text-center">
        Privacy: what we keep and who sees it
      </a>
    </div>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api("/api/account/delete", { post: true, token: getToken() });
      onDeleted();
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={SECONDARY_BUTTON} onClick={() => setConfirming(true)}>
        Delete my account and data
      </button>
    );
  }
  return (
    <Card title="Delete everything?">
      <p>This removes your profile, photos, goals and Fitbit connection, and ends your partnership. It can&apos;t be undone.</p>
      {error && <ErrorNote message={error} />}
      <button type="button" className={PRIMARY_BUTTON} disabled={busy} onClick={remove}>
        {busy ? "Deleting..." : "Yes, delete everything"}
      </button>
      <button type="button" className={SECONDARY_BUTTON} onClick={() => setConfirming(false)}>
        Keep my account
      </button>
    </Card>
  );
}

function PointsCard({ points }: { points: number }) {
  return (
    <Card title={`${points} points`}>
      <ul className="space-y-1">
        <li>Check in: +{POINTS.done}</li>
        <li>Partner confirms your photo: +{POINTS.confirmed}</li>
        <li>Fitbit proves your steps: +{POINTS.fitbit}</li>
        <li>Rough day, honestly told: +{POINTS.rough}</li>
      </ul>
      <p className="text-muted">Points unlock new extras for your character.</p>
    </Card>
  );
}
