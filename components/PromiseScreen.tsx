"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, saveToken } from "@/lib/api";
import { randomAvatar } from "@/lib/avatar";
import type { Config, JoinResult, Today } from "@/lib/types";
import { Customizer } from "./Customizer";
import { PixelAvatar } from "./PixelAvatar";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SupportFooter, WhyPanel, Wordmark } from "./Shared";

const STEP_TITLES = ["Your goal", "Your character", "Your time"];

// Screen 1: the welcome page, then three short steps.
export function PromiseScreen({ onJoined }: { onJoined: (today: Today) => void }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [step, setStep] = useState(0); // 0 is the welcome page
  const [goalText, setGoalText] = useState("");
  const [goalType, setGoalType] = useState("recovery");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [avatar, setAvatar] = useState("h0-c1-s2-e0-o1-k0-a0");
  const [partnerPreview] = useState("h3-c3-s1-e2-o0-k9-a0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refused, setRefused] = useState<Extract<JoinResult, { allowed: false }> | null>(null);

  useEffect(() => {
    setAvatar(randomAvatar());
    api<Config>("/api/config")
      .then(setConfig)
      .catch(() => setError("We can't reach Show Up right now. You can still try the demo."));
  }, []);

  async function join(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setRefused(null);
    try {
      const result = await api<JoinResult>("/api/join", { body: { goalText, goalType, checkInTime, avatar } });
      if (result.allowed) {
        saveToken(result.token);
        onJoined(result.today);
      } else {
        setRefused(result);
        setStep(1);
      }
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === 0) {
    return (
      <div className="rise-in space-y-6">
        <Wordmark />
        <div className="flex items-end justify-center gap-2 rounded-3xl bg-[#ffe58a] px-4 pt-8 pb-4">
          <PixelAvatar code={avatar} mood="happy" scale={4} animate label="Two pixel characters standing side by side, looking happy." />
          <PixelAvatar code={partnerPreview} mood="happy" scale={4} animate />
        </div>
        <header className="space-y-3">
          <p className="font-semibold text-accent-dark">For anyone working on a health goal alone</p>
          <h1 className="font-display text-5xl leading-none font-semibold">Health goals are easier in twos.</h1>
          <p className="text-xl">
            Get matched with someone on a similar goal. Check in once a day. Go quiet, and your character lets you know about it.
          </p>
        </header>
        {error && <ErrorNote message={error} />}
        <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep(1)}>
          Get started
        </button>
        <a href="/?demo=1" className={`${QUIET_BUTTON} block text-center`}>
          See a demo first
        </a>
        <ul className="grid gap-3">
          <Point title="Anonymous" text="No real names, emails or photos." />
          <Point title="Any goal counts" text="Physio, sleep, getting outside. It's your call." />
          <Point title="Rough days are allowed" text="Tap it, and your streak stays safe." />
        </ul>
        {config && <SupportFooter support={config.support} notMedicalCare={config.notMedicalCare} />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Wordmark />
        <p className="font-semibold text-muted">
          Step {step} of {STEP_TITLES.length}
        </p>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        {STEP_TITLES.map((title, index) => (
          <div key={title} className={`h-2 flex-1 rounded-full ${index < step ? "bg-accent" : "bg-line"}`} />
        ))}
      </div>

      {step === 1 && (
        <form
          className="rise-in space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setStep(2);
          }}
        >
          <h1 className="font-display text-4xl leading-tight font-semibold">What do you want to do each day?</h1>
          <Card>
            <label htmlFor="goal" className="block font-bold">
              Your goal
            </label>
            <textarea
              id="goal"
              required
              minLength={3}
              maxLength={200}
              rows={3}
              value={goalText}
              onChange={(event) => setGoalText(event.target.value)}
              placeholder="Do my physio exercises every morning"
              className="w-full rounded-2xl border-2 border-line bg-paper p-3 placeholder:text-muted"
            />
            <p className="text-muted">Please leave out names and other personal details.</p>
          </Card>

          {refused && (
            <div className="space-y-3">
              <ErrorNote message={refused.refusalReason} />
              {refused.showSupportLinks && (
                <ul className="space-y-1">
                  {refused.support.map((link) => (
                    <li key={link.href}>
                      <a className="font-bold text-accent-dark underline underline-offset-4" href={link.href}>
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <WhyPanel why={refused.why} title="Why? See how this was decided" />
            </div>
          )}

          <Card>
            <fieldset className="space-y-2">
              <legend className="mb-2 font-bold">What kind of goal is it?</legend>
              <div className="grid grid-cols-2 gap-2">
                {(config?.goalTypes ?? []).map((type) => (
                  <label
                    key={type.id}
                    className="flex min-h-14 cursor-pointer items-center rounded-2xl border-2 border-line p-3 font-medium has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent"
                  >
                    <input
                      type="radio"
                      name="goalType"
                      className="sr-only"
                      checked={goalType === type.id}
                      onChange={() => setGoalType(type.id)}
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </Card>

          <button type="submit" className={PRIMARY_BUTTON}>
            Next
          </button>
          <button type="button" className={QUIET_BUTTON} onClick={() => setStep(0)}>
            Back
          </button>
        </form>
      )}

      {step === 2 && (
        <div className="rise-in space-y-5">
          <h1 className="font-display text-4xl leading-tight font-semibold">Make your character.</h1>
          <p>This is who your partner sees, instead of you. It reacts to how your week is going.</p>
          <Card>
            <Customizer code={avatar} onChange={setAvatar} />
          </Card>
          <button type="button" className={PRIMARY_BUTTON} onClick={() => setStep(3)}>
            Next
          </button>
          <button type="button" className={QUIET_BUTTON} onClick={() => setStep(1)}>
            Back
          </button>
        </div>
      )}

      {step === 3 && (
        <form className="rise-in space-y-5" onSubmit={join}>
          <h1 className="font-display text-4xl leading-tight font-semibold">When will you check in?</h1>
          <Card>
            <label htmlFor="time" className="block font-bold">
              Each day at
            </label>
            <input
              id="time"
              type="time"
              required
              value={checkInTime}
              onChange={(event) => setCheckInTime(event.target.value)}
              className="min-h-14 w-full rounded-2xl border-2 border-line bg-paper px-4 text-xl"
            />
            <p className="text-muted">Calgary time. Pick a time you'd really be free.</p>
          </Card>
          {config && <p className="px-1 text-muted">{config.privacyLine}</p>}
          {error && <ErrorNote message={error} />}
          <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
            {busy ? "Checking your goal..." : "Find my partner"}
          </button>
          <button type="button" className={QUIET_BUTTON} onClick={() => setStep(2)}>
            Back
          </button>
          {config && (
            <details className="rounded-3xl bg-card p-5 shadow-sm">
              <summary className="cursor-pointer font-semibold">What this app uses</summary>
              <ul className="mt-3 space-y-3">
                {config.sources.map((source) => (
                  <li key={source.name}>
                    <a className="font-medium text-accent-dark underline underline-offset-4" href={source.url}>
                      {source.name}
                    </a>
                    <p className="text-muted">{source.usedFor}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </form>
      )}
    </div>
  );
}

function Point({ title, text }: { title: string; text: string }) {
  return (
    <li className="rounded-2xl bg-card p-4 shadow-sm">
      <p className="font-bold">{title}</p>
      <p className="text-muted">{text}</p>
    </li>
  );
}
