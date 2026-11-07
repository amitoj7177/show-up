"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, clearToken, getToken } from "@/lib/api";
import { DEMO_AVATAR, demoToday } from "@/lib/demo";
import { MASCOT_MOODS, MESSAGES, NOT_MEDICAL_CARE, PRIVACY_LINE, REPORT_REASONS, SUPPORT_LINKS, type MascotMood } from "@/lib/rules";
import type { Act, Config, Today } from "@/lib/types";
import { PixelAvatar } from "./PixelAvatar";
import { PromiseScreen } from "./PromiseScreen";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, SupportFooter, Wordmark } from "./Shared";
import { TodayScreen } from "./TodayScreen";

const REFRESH_EVERY_MS = 3000;

// Decides which screen to show. ?demo=1 always shows labelled sample data, with no internet needed.
export function App() {
  const [mode, setMode] = useState<"loading" | "demo" | "live">("loading");

  useEffect(() => {
    setMode(new URLSearchParams(window.location.search).get("demo") === "1" ? "demo" : "live");
  }, []);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
      {mode === "demo" && <DemoApp />}
      {mode === "live" && <LiveApp />}
      {mode === "loading" && <p role="status">Loading...</p>}
    </main>
  );
}

function LiveApp() {
  const [today, setToday] = useState<Today | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setToday(null);
      setChecking(false);
      return;
    }
    try {
      setToday(await api<Today>("/api/today", { token }));
      setOfflineSince(null);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) {
        clearToken();
        setToday(null);
      } else {
        // Keep showing the last good screen rather than an error page.
        setOfflineSince((since) => since ?? new Date());
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    api<Config>("/api/config")
      .then(setConfig)
      .catch(() => setConfig(null));
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const act: Act = async (path, body) => {
    setError("");
    try {
      setToday(await api<Today>(path, { body, post: true, token: getToken() }));
    } catch (problem) {
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    }
  };

  if (checking) return <p role="status">Loading...</p>;
  if (!today) return <PromiseScreen onJoined={setToday} />;

  const offlineNote = offlineSince && (
    <ErrorNote message={`We're having trouble connecting. Last updated at ${offlineSince.toLocaleTimeString("en-CA")}.`} />
  );

  if (today.status === "left") {
    return (
      <div className="rise-in space-y-5">
        <Wordmark />
        <Card title="You've left">
          <p>Thanks for showing up. Come back whenever you're ready.</p>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={() => {
              clearToken();
              setToday(null);
            }}
          >
            Make a new promise
          </button>
        </Card>
      </div>
    );
  }

  if (today.status === "waiting") {
    return (
      <div className="rise-in space-y-5">
        <Wordmark />
        {offlineNote}
        {today.notice && <ErrorNote message={today.notice} />}
        <div className="flex justify-center rounded-3xl bg-[#cfe0f5] py-6">
          <PixelAvatar code={today.me.avatar} mood="waiting" scale={5} label={today.mascot.screenReaderText} />
        </div>
        <h1 aria-live="polite" className="font-display text-4xl font-semibold">
          Finding your partner...
        </h1>
        <p>
          You're <strong>{today.me.nickname}</strong>. We look for someone on a similar goal first. It's usually under a minute if someone else is looking.
        </p>
        <Card title="Your goal">
          <p>{today.me.goal.text}</p>
        </Card>
        <button type="button" className={QUIET_BUTTON} onClick={() => act("/api/leave")}>
          Cancel
        </button>
        <SupportFooter support={today.support} notMedicalCare={today.notMedicalCare} />
      </div>
    );
  }

  return (
    <>
      {offlineNote}
      <TodayScreen
        today={today}
        config={config}
        act={act}
        error={error}
        demoLabel={today.isDemo ? "Demo: sample partner" : undefined}
        demoControls={today.isDemo ? <LiveDemoControls act={act} /> : undefined}
      />
    </>
  );
}

// For a demo that uses the real database, with a labelled sample partner.
function LiveDemoControls({ act }: { act: Act }) {
  return (
    <Card title="Demo controls">
      <button type="button" className={SECONDARY_BUTTON} onClick={() => act("/api/demo/skip-day")}>
        Skip to tomorrow
      </button>
      <button type="button" className={SECONDARY_BUTTON} onClick={() => act("/api/demo/partner-checkin", { status: "done" })}>
        Make my partner check in
      </button>
    </Card>
  );
}

// The ?demo=1 tour. Everything happens on the phone, so it works even with no internet.
function DemoApp() {
  const [mood, setMood] = useState<MascotMood>("mad");
  const [messageSent, setMessageSent] = useState(false);
  const [gentle, setGentle] = useState(false);
  const [avatar, setAvatar] = useState(DEMO_AVATAR);

  const sample = demoToday(gentle && ["annoyed", "mad", "furious"].includes(mood) ? "waiting" : mood) as Today;
  const today: Today = {
    ...sample,
    me: { ...sample.me, gentleMascot: gentle, avatar },
    canSendMessage: !messageSent,
  };

  const config: Config = {
    goalTypes: [],
    messages: MESSAGES,
    reportReasons: REPORT_REASONS,
    support: SUPPORT_LINKS,
    notMedicalCare: NOT_MEDICAL_CARE,
    privacyLine: PRIVACY_LINE,
    sources: [],
  };

  const act: Act = async (path, body) => {
    const values = (body ?? {}) as { status?: string; gentleMascot?: boolean; avatar?: string };
    if (path === "/api/checkin") setMood(values.status === "rough" ? "caring" : "happy");
    if (path === "/api/encourage") setMessageSent(true);
    if (path === "/api/settings") {
      if (values.gentleMascot !== undefined) setGentle(values.gentleMascot);
      if (values.avatar) setAvatar(values.avatar);
    }
  };

  return (
    <TodayScreen
      today={today}
      config={config}
      act={act}
      error=""
      demoLabel="Demo: sample data, nothing is saved"
      demoControls={
        <Card title="Demo: jump to a mood">
          <p>Your character gets madder the longer you stay quiet.</p>
          <div className="grid grid-cols-2 gap-2">
            {MASCOT_MOODS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mood === option}
                className={`${mood === option ? PRIMARY_BUTTON : SECONDARY_BUTTON} capitalize`}
                onClick={() => {
                  setMood(option);
                  window.scrollTo(0, 0);
                }}
              >
                {option}
              </button>
            ))}
          </div>
          <a href="/" className={`${QUIET_BUTTON} block text-center`}>
            Leave the demo
          </a>
        </Card>
      }
    />
  );
}
