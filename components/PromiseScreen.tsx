"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError, getToken, saveToken } from "@/lib/api";
import { DEFAULT_AVATAR } from "@/lib/avatar";
import { PASSWORD_RULE, strongEnough } from "@/lib/rules";
import type { Config, JoinResult, Today } from "@/lib/types";
import { Customizer } from "./Customizer";
import { ProfileForm } from "./ProfileForm";
import { PixelAvatar } from "./PixelAvatar";
import { PixelScene } from "./PixelScene";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, TitleBar, WhyPanel } from "./Shared";

type Screen = "welcome" | "login" | "signup" | "avatar" | "profile" | "done" | "promise";
type AuthResult = { token: string; avatar: string; hasPromise: boolean; profileComplete: boolean };

const STARTER_AVATAR = "h0-c1-s2-e1-o1-k3-a0"; // the character in the Promise Pals design

// Everything before the main app: welcome, log in, sign up, avatar, then make a promise.
export type { Screen as PromiseStart };
export function PromiseScreen({
  start = "welcome",
  onJoined,
  onLoggedIn,
  onExit,
}: {
  start?: Screen;
  onJoined: (today: Today) => void;
  onLoggedIn: () => void;
  onExit?: () => void;
}) {
  const [screen, setScreen] = useState<Screen>(start);
  const [config, setConfig] = useState<Config | null>(null);
  const [avatar, setAvatar] = useState(STARTER_AVATAR);
  const [doneTitle, setDoneTitle] = useState("You're all set");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goalType, setGoalType] = useState("recovery");
  const [checkInTime, setCheckInTime] = useState("08:00");
  const [groupCode, setGroupCode] = useState("");
  const [whyItMatters, setWhyItMatters] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [refused, setRefused] = useState<Extract<JoinResult, { allowed: false }> | null>(null);

  useEffect(() => {
    api<Config>("/api/config")
      .then(setConfig)
      .catch(() => setError("We can't reach Promise Pals right now. You can still try the demo."));
    if (getToken()) {
      api<{ avatar: string }>("/api/account", { token: getToken() })
        .then((account) => {
          if (account.avatar !== DEFAULT_AVATAR) setAvatar(account.avatar);
        })
        .catch(() => undefined);
    }
  }, []);

  function go(next: Screen) {
    if (next === "welcome" && onExit) {
      onExit();
      return;
    }
    setError("");
    setNote("");
    setPassword("");
    setShowPassword(false);
    setScreen(next);
    window.scrollTo(0, 0);
  }

  async function run(work: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNote("");
    try {
      await work();
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 409 && screen === "promise") {
        go("profile");
        setError(problem.message);
        return;
      }
      setError(problem instanceof ApiError ? problem.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function signUp(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      const result = await api<AuthResult>("/api/auth/signup", { body: { email, password } });
      saveToken(result.token);
      setDoneTitle("You're all set");
      go("avatar");
    });
  }

  function logIn(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      const result = await api<AuthResult>("/api/auth/login", { body: { email, password } });
      saveToken(result.token);
      if (result.hasPromise) {
        onLoggedIn();
        return;
      }
      if (result.avatar !== DEFAULT_AVATAR) setAvatar(result.avatar);
      setDoneTitle("Welcome back");
      go(result.profileComplete ? "done" : "profile");
    });
  }

  function forgot() {
    run(async () => {
      const result = await api<{ message: string }>("/api/auth/forgot", { body: { email } });
      setNote(result.message);
    });
  }

  function saveAvatar() {
    run(async () => {
      await api("/api/account", { body: { avatar }, token: getToken() });
      go("profile");
    });
  }

  function makePromise(event: FormEvent) {
    event.preventDefault();
    setRefused(null);
    run(async () => {
      const result = await api<JoinResult>("/api/join", { body: { goalText, goalType, checkInTime, avatar, groupCode, whyItMatters }, token: getToken() });
      if (result.allowed) {
        saveToken(result.token);
        onJoined(result.today);
      } else {
        setRefused(result);
        window.scrollTo(0, 0);
      }
    });
  }

  const passwordField = (id: string, autoComplete: string, placeholder: string) => (
    <div>
      <label className="px-label" htmlFor={id}>
        Password
      </label>
      <div className="relative">
        <input
          id={id}
          className="px-input pr-20"
          type={showPassword ? "text" : "password"}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button type="button" aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)} className="px-link absolute top-1 right-1 min-h-11 px-2">
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );

  const emailField = (id: string) => (
    <div>
      <label className="px-label" htmlFor={id}>
        Email
      </label>
      <input id={id} className="px-input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" autoComplete="email" />
    </div>
  );

  return (
    <div className="px-card overflow-hidden">
      {screen === "welcome" && (
        <>
          <PixelScene code={avatar} mood="happy" label="A pixel character waving hello in a sunny park." bubble="HI!" />
          <div className="space-y-4 p-5">
            <h1 className="text-3xl font-bold leading-tight">Promise Pals</h1>
            <p>Make a promise. Check in every day. Your partner sees it live.</p>
            <p className="font-semibold">For anyone working on a health goal alone.</p>
            {error && <ErrorNote message={error} />}
            <button type="button" className={PRIMARY_BUTTON} onClick={() => go("signup")}>
              Sign up
            </button>
            <button type="button" className={SECONDARY_BUTTON} onClick={() => go("login")}>
              Log in
            </button>
            <a href="/?demo=1" className={QUIET_BUTTON}>
              See a demo first
            </a>
          </div>
        </>
      )}

      {screen === "login" && (
        <>
          <TitleBar title="Log in" onBack={() => go("welcome")} />
          <form onSubmit={logIn} className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <div className="shrink-0 border border-line rounded-2xl bg-[#ffe58a] p-1">
                <PixelAvatar code={avatar} mood="happy" scale={2} />
              </div>
              <p>Welcome back. Ready to check in?</p>
            </div>
            {emailField("login-email")}
            {passwordField("login-password", "current-password", "Your password")}
            {error && <ErrorNote message={error} />}
            {note && (
              <p role="status" className="font-medium text-[#1f6b2a]">
                {note}
              </p>
            )}
            <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
              {busy ? "Checking..." : "Log in"}
            </button>
            <button type="button" className={QUIET_BUTTON} onClick={forgot}>
              Forgot password?
            </button>
            <p className="text-center">
              New here?{" "}
              <button type="button" className="px-link" onClick={() => go("signup")}>
                Sign up
              </button>
            </p>
          </form>
        </>
      )}

      {screen === "signup" && (
        <>
          <TitleBar title="Sign up" onBack={() => go("welcome")} />
          <form onSubmit={signUp} className="space-y-4 p-5">
            <p>Create an account. Next you will build your avatar.</p>
            {emailField("signup-email")}
            {passwordField("signup-password", "new-password", "Make a strong password")}
            <p id="password-rule" className={password && !strongEnough(password) ? "font-medium" : "text-muted"}>
              {strongEnough(password) ? "Strong enough ✓" : PASSWORD_RULE}
            </p>
            {config && <p className="text-muted">{config.privacyLine}</p>}
            {error && <ErrorNote message={error} />}
            <button type="submit" disabled={busy || !strongEnough(password)} className={PRIMARY_BUTTON}>
              {busy ? "Checking..." : "Create account"}
            </button>
            <p className="text-center">
              Have an account?{" "}
              <button type="button" className="px-link" onClick={() => go("login")}>
                Log in
              </button>
            </p>
          </form>
        </>
      )}

      {screen === "profile" && (
        <>
          <TitleBar title="About you" onBack={() => go("avatar")} />
          <div className="space-y-4 p-5">
            <p>Your partner is a real person in Calgary, and so are you. This is what they&apos;ll see.</p>
            {error && <ErrorNote message={error} />}
            <ProfileForm submitLabel="Looks good" onSaved={() => go("done")} />
          </div>
        </>
      )}

      {screen === "avatar" && (
        <>
          <TitleBar title="Your avatar" />
          <div className="space-y-4 p-5">
            <p>This is who your partner sees, instead of you.</p>
            <Customizer code={avatar} onChange={setAvatar} />
            {error && <ErrorNote message={error} />}
            <button type="button" disabled={busy} className={PRIMARY_BUTTON} onClick={saveAvatar}>
              Looks good
            </button>
          </div>
        </>
      )}

      {screen === "done" && (
        <>
          <PixelScene code={avatar} mood="proud" label="Your character waving proudly in a sunny park." />
          <div className="space-y-4 p-5 text-center">
            <h1 className="text-2xl font-bold leading-tight">{doneTitle}</h1>
            <p>Next: make your first promise and pick a daily check-in time.</p>
            <button type="button" className={PRIMARY_BUTTON} onClick={() => go("promise")}>
              Make a promise
            </button>
          </div>
        </>
      )}

      {screen === "promise" && (
        <>
          <TitleBar title="Your promise" />
          <form onSubmit={makePromise} className="space-y-5 p-5">
            {refused && (
              <div className="space-y-3">
                <ErrorNote message={refused.refusalReason} />
                {refused.showSupportLinks && (
                  <ul className="space-y-1">
                    {refused.support.map((link) => (
                      <li key={link.href}>
                        <a className="px-link font-bold" href={link.href}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <WhyPanel why={refused.why} title="Why? See how this was decided" />
              </div>
            )}

            <div>
              <label htmlFor="goal" className="px-label">
                I promise to
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
                className="px-input"
              />
              <p className="mt-1 text-muted">Please leave out names and other personal details.</p>
            </div>

            <div>
              <label htmlFor="why" className="px-label">
                Why it matters to me (optional)
              </label>
              <textarea
                id="why"
                maxLength={140}
                rows={2}
                value={whyItMatters}
                onChange={(event) => setWhyItMatters(event.target.value)}
                placeholder="I want to keep up with my kids again"
                className="px-input"
              />
              <p className="mt-1 text-muted">Your partner sees this. It helps them cheer you on.</p>
            </div>

            <fieldset>
              <legend className="px-label">Kind of goal</legend>
              <div className="grid grid-cols-2 gap-2">
                {(config?.goalTypes ?? []).map((type) => (
                  <label
                    key={type.id}
                    className="flex min-h-14 cursor-pointer items-center border border-line rounded-2xl bg-white p-2 font-medium has-checked:bg-[#fffc00] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-[#0b6bcb]"
                  >
                    <input type="radio" name="goalType" className="sr-only" checked={goalType === type.id} onChange={() => setGoalType(type.id)} />
                    {type.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="time" className="px-label">
                Check in each day at
              </label>
              <input id="time" type="time" required value={checkInTime} onChange={(event) => setCheckInTime(event.target.value)} className="px-input" />
              <p className="mt-1 text-muted">Calgary time.</p>
            </div>

            <div>
              <label htmlFor="group-code" className="px-label">
                Clinic or campus code (optional)
              </label>
              <input
                id="group-code"
                className="px-input uppercase"
                value={groupCode}
                onChange={(event) => setGroupCode(event.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="From your physio or campus program"
              />
              <p className="mt-1 text-muted">With a code, you're only paired with people from the same place.</p>
            </div>

            {error && <ErrorNote message={error} />}
            <button type="submit" disabled={busy} className={PRIMARY_BUTTON}>
              {busy ? "Checking your goal..." : "Find my partner"}
            </button>

            {config && (
              <details className="border border-line rounded-2xl bg-white p-3">
                <summary className="cursor-pointer font-semibold">What this app uses</summary>
                <ul className="mt-3 space-y-3">
                  {config.sources.map((source) => (
                    <li key={source.name}>
                      <a className="px-link font-medium" href={source.url}>
                        {source.name}
                      </a>
                      <p className="text-muted">{source.usedFor}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </form>
        </>
      )}
    </div>
  );
}
