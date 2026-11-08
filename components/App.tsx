"use client";

import { scrollPhoneToTop } from "./PhoneFrame";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, clearToken, getToken } from "@/lib/api";
import { DEMO_AVATAR, demoToday } from "@/lib/demo";
import { BADGES, MASCOT_MOODS, MESSAGES, NOT_MEDICAL_CARE, PRIVACY_LINE, REPORT_REASONS, SUPPORT_LINKS, TALK, type MascotMood } from "@/lib/rules";
import type { NearbyPerson } from "@/lib/nearby";
import type { Act, Config, Today } from "@/lib/types";
import { FindingScreen, PartnerFoundScreen, useLinePicker } from "./Moments";
import { Landing } from "./Landing";
import { PromiseScreen, type PromiseStart } from "./PromiseScreen";
import { Card, DemoLabel, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, Wordmark } from "./Shared";
import { TodayScreen } from "./TodayScreen";

const REFRESH_EVERY_MS = 3000;

// The app itself is phone-shaped, even on a laptop. The public website uses the full width.
function Phone({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">{children}</main>;
}

// Decides which screen to show. ?demo=1 always shows labelled sample data, with no internet needed.
export function App() {
  const [mode, setMode] = useState<"loading" | "demo" | "live">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMode(params.get("demo") === "1" ? "demo" : "live");
    // Opened an invite link: remember it until they make their promise.
    const invite = params.get("invite");
    if (invite) {
      try {
        sessionStorage.setItem("invite", invite);
      } catch {
        // Private browsing: the invite just won't apply.
      }
    }
  }, []);

  return (
    <>
      {mode === "demo" && <Phone><DemoApp /></Phone>}
      {mode === "live" && <LiveApp />}
      {mode === "loading" && <Phone><p role="status">Loading...</p></Phone>}
    </>
  );
}

function LiveApp() {
  const [today, setToday] = useState<Today | null>(null);
  const [needsPromise, setNeedsPromise] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const hasToday = useRef(false);
  hasToday.current = today !== null;
  const [celebrating, setCelebrating] = useState(false);
  const [authStart, setAuthStart] = useState<PromiseStart | null>(null);
  const wasPaired = useRef<boolean | null>(null);
  const pick = useLinePicker();
  const [foundLine, setFoundLine] = useState("");

  // Celebrate the moment someone goes from waiting to having a partner.
  useEffect(() => {
    const paired = today?.status === "paired";
    if (wasPaired.current === false && paired) {
      setFoundLine(pick("found", config?.talk.found ?? TALK.found));
      setCelebrating(true);
    }
    if (today) wasPaired.current = paired;
  }, [today, config, pick]);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setToday(null);
      setNeedsPromise(false);
      setChecking(false);
      return;
    }
    try {
      setToday(await api<Today>("/api/today", { token }));
      setNeedsPromise(false);
      setOfflineSince(null);
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 401) {
        clearToken();
        setToday(null);
      } else if (problem instanceof ApiError && problem.status === 409) {
        // Logged in, but no promise yet.
        setToday(null);
        setNeedsPromise(true);
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
      // While signing up, nothing here needs refreshing, so the form isn't disturbed.
      if (document.visibilityState === "visible" && hasToday.current) refresh();
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

  async function logOut() {
    await api("/api/auth/logout", { post: true, token: getToken() }).catch(() => undefined);
    clearToken();
    setToday(null);
    setNeedsPromise(false);
    setAuthStart(null);
  }

  if (checking) return <Phone><p role="status">Loading...</p></Phone>;
  if (!today && !needsPromise && !authStart && !invited()) return <Landing onStart={setAuthStart} />;
  if (!today) {
    return (
      <Phone>
      <PromiseScreen
        key={needsPromise ? "promise" : "start"}
        start={needsPromise ? "promise" : (authStart ?? "welcome")}
        onJoined={(joined) => {
          wasPaired.current = false;
          setToday(joined);
        }}
        onLoggedIn={refresh}
        onExit={() => setAuthStart(null)}
      />
      </Phone>
    );
  }

  const offlineNote = offlineSince && (
    <ErrorNote message={`We're having trouble connecting. Last updated at ${offlineSince.toLocaleTimeString("en-CA")}.`} />
  );

  if (today.status === "left") {
    return (
      <Phone>
      <div className="space-y-5">
        <Wordmark />
        <Card title="You've left">
          <p>Thanks for showing up. Come back whenever you're ready.</p>
          <button
            type="button"
            className={PRIMARY_BUTTON}
            onClick={() => {
              setToday(null);
              setNeedsPromise(true);
            }}
          >
            Make a new promise
          </button>
          <button type="button" className={SECONDARY_BUTTON} onClick={logOut}>
            Log out
          </button>
        </Card>
      </div>
      </Phone>
    );
  }

  if (today.status === "waiting") {
    return (
      <Phone>
        <div className="space-y-4">
          {offlineNote}
          {error && <ErrorNote message={error} />}
          <FindingScreen today={today} act={act} onCancel={() => act("/api/leave")} />
        </div>
      </Phone>
    );
  }

  if (celebrating) {
    return (
      <Phone>
        <PartnerFoundScreen today={today} line={foundLine} onContinue={() => setCelebrating(false)} />
      </Phone>
    );
  }

  return (
    <Phone>
      {offlineNote}
      <TodayScreen
        today={today}
        config={config}
        act={act}
        error={error}
        onLogOut={logOut}
        demoLabel={today.isDemo ? "Demo: sample partner" : undefined}
        demoControls={today.isDemo ? <LiveDemoControls act={act} /> : undefined}
      />
    </Phone>
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

// Labelled sample progress for the demo, from the team's home screen design.
const DEMO_HISTORY = {
  promise: "Do my physio exercises every morning",
  days: [..."ddsddddmdddddsddddddddmddddd"].map((key, index) => ({
    date: `sample-${index}`,
    mark: key === "d" ? ("done" as const) : key === "s" ? ("skipped" as const) : ("missed" as const),
  })),
  finished: true,
};

// The ?demo=1 tour. Everything happens on the phone, so it works even with no internet.
// Sample people for the demo board. Clearly labelled as samples on screen.
function demoPeople(partner: NonNullable<Today["partner"]>): NearbyPerson[] {
  const person = (fields: Partial<NearbyPerson> & Pick<NearbyPerson, "userId" | "firstName" | "avatar" | "goal">): NearbyPerson => ({
    photoId: null,
    communityName: null,
    moveTag: null,
    km: null,
    goalTypeLabel: "Recovery or physio",
    whyItMatters: null,
    activeNow: false,
    askedByMe: false,
    ...fields,
  });
  return [
    person({ userId: "sample-1", firstName: partner.nickname, avatar: partner.avatar, goal: partner.goal ?? "Take a 10-minute walk", communityName: partner.communityName ?? "Hillhurst", km: 2, activeNow: true, whyItMatters: partner.whyItMatters ?? null }),
    person({ userId: "sample-2", firstName: "Maya", avatar: "h1-c2-s3-e2-o2-k7-a1", goal: "Wheel 15 minutes around my block", communityName: "Bridgeland/Riverside", km: 4, moveTag: "Wheelchair user", whyItMatters: "Getting outside clears my head." }),
    person({ userId: "sample-3", firstName: "Priya", avatar: "h3-c3-s1-e2-o0-k9-a0", goal: "Do my knee physio stretches daily", communityName: "Sunalta", km: 6 }),
  ];
}

function DemoApp() {
  const [stage, setStage] = useState<"board" | "found" | "today">("board");
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
    talk: TALK,
    badges: BADGES,
    reportReasons: REPORT_REASONS,
    support: SUPPORT_LINKS,
    notMedicalCare: NOT_MEDICAL_CARE,
    privacyLine: PRIVACY_LINE,
    sources: [],
  };

  const act: Act = async (path, body) => {
    const values = (body ?? {}) as { status?: string; gentleMascot?: boolean; avatar?: string };
    if (path === "/api/checkin") setMood(values.status === "rough" ? "sad" : "happy");
    if (path === "/api/encourage") setMessageSent(true);
    if (path === "/api/settings") {
      if (values.gentleMascot !== undefined) setGentle(values.gentleMascot);
      if (values.avatar) setAvatar(values.avatar);
    }
  };

  // The demo starts on the Nearby board. Asking anyone matches you straight away.
  if (stage !== "today" && sample.partner) {
    const board = { ...today, status: "waiting", partner: null, pair: null, nearby: { requests: [], people: demoPeople(sample.partner) } } as Today;
    return (
      <div className="space-y-4">
        <DemoLabel text="Demo: sample people, nothing is saved" />
        {stage === "board" ? (
          <FindingScreen
            today={board}
            demo
            act={async (path) => {
              if (path === "/api/team-up") setStage("found");
            }}
            onCancel={() => setStage("today")}
          />
        ) : (
          <PartnerFoundScreen
            today={today}
            line={TALK.found[0]}
            onContinue={() => {
              setStage("today");
              scrollPhoneToTop();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <TodayScreen
      today={today}
      config={config}
      act={act}
      error=""
      demoLabel="Demo: sample data, nothing is saved"
      sampleHistory={DEMO_HISTORY}
      demoControls={
        <Card title="Demo: jump to a mood">
          <p>Your avatar gets madder the longer you stay quiet.</p>
          <div className="grid grid-cols-2 gap-2">
            {MASCOT_MOODS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mood === option}
                className={`min-h-12 border border-line rounded-2xl font-semibold capitalize ${mood === option ? "bg-accent text-white" : "bg-white"}`}
                onClick={() => {
                  setMood(option);
                  scrollPhoneToTop();
                }}
              >
                {option}
              </button>
            ))}
          </div>
          <a href="/" className={QUIET_BUTTON}>
            Leave the demo
          </a>
        </Card>
      }
    />
  );
}

// Someone who opened an invite link goes straight to sign-up, not the landing page.
function invited(): boolean {
  try {
    return Boolean(sessionStorage.getItem("invite"));
  } catch {
    return false;
  }
}
