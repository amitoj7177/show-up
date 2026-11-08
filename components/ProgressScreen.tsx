"use client";

import { useEffect, useRef, useState } from "react";
import { wantsLessMotion } from "@/lib/reading";
import { api, getToken } from "@/lib/api";
import { BADGES, personalStats, TALK } from "@/lib/rules";
import type { Act, Config, History, Today } from "@/lib/types";
import { useLinePicker } from "./Moments";
import { PixelAvatar } from "./PixelAvatar";
import { Card, ErrorNote, PRIMARY_BUTTON, QUIET_BUTTON, SECONDARY_BUTTON, WhyPanel } from "./Shared";

// Tiny pixel icons from the Promise Pals design. Each row of x's is one row of pixels.
const ICONS = {
  fire: [
    { colour: "#fb8c00", rows: ["...x....", "..xx....", "..xxx...", ".xxxx...", "xxxxxx..", "xxxxxxx.", "xxxxxxx.", ".xxxxx.."] },
    { colour: "#ffd54f", rows: ["........", "........", "........", "........", "........", "..xx....", ".xxxx...", "..xx...."] },
  ],
  star: [{ colour: "#ffd54f", rows: [".........", "...x.....", "...x.....", ".xxxxx...", "..xxx....", "..x.x...."] }],
  heart: [{ colour: "#ec407a", rows: ["........", ".x.x....", "xxxxx...", "xxxxx...", ".xxx....", "..x....."] }],
  badge: [{ colour: "#fb8c00", rows: [".........", "...x.....", "...x.....", ".xxxxx...", "..xxx....", "..x.x...."] }],
  sprout: [
    { colour: "#43a047", rows: ["........", ".xx..xx.", "xxx..xxx", ".xxxxxx.", "...xx...", "...xx..."] },
    { colour: "#8d5a2b", rows: ["........", "........", "........", "........", "........", "........", "..xxxx..", ".xxxxxx."] },
  ],
  medal: [
    { colour: "#3f6fd8", rows: ["x.....x.", ".x...x..", "..x.x...", "........"] },
    { colour: "#ffd54f", rows: ["........", "........", "........", "..xxx...", ".xxxxx..", ".xxxxx..", ".xxxxx..", "..xxx..."] },
  ],
  bolt: [{ colour: "#fbc02d", rows: ["....xx..", "...xx...", "..xx....", ".xxxxx..", "...xx...", "..xx....", ".xx.....", "x......."] }],
  trophy: [
    { colour: "#ffd54f", rows: ["xxxxxxx.", "xxxxxxx.", ".xxxxx..", "..xxx...", "...x....", "...x....", "........", "........"] },
    { colour: "#8d5a2b", rows: ["........", "........", "........", "........", "........", "........", "..xxx...", ".xxxxx.."] },
  ],
};

// A different reward icon for each badge.
const BADGE_ICONS: Record<string, keyof typeof ICONS> = {
  first: "sprout",
  three: "fire",
  week: "star",
  "two-weeks": "medal",
  habit: "bolt",
  month: "trophy",
};

function PixelIcon({ name, size = 24 }: { name: keyof typeof ICONS; size?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, 8, 8);
    for (const layer of ICONS[name]) {
      context.fillStyle = layer.colour;
      layer.rows.forEach((row, y) => [...row].forEach((ch, x) => ch === "x" && context.fillRect(x, y, 1, 1)));
    }
  }, [name]);
  return <canvas ref={canvas} width={8} height={8} aria-hidden="true" className="pixel mx-auto block" style={{ width: size, height: size }} />;
}

const DAY_STYLE = { done: "bg-[#8fd37f]", skipped: "bg-[#d9c8f2]", missed: "bg-[#e8e2d2]" };
const CONFETTI = ["#ffd54f", "#ec407a", "#0fadff", "#8fd37f", "#fb8c00"];

// Your progress: streaks, every day so far, badges and your partner.
export function ProgressScreen({ today, config, act, sample }: { today: Today; config: Config | null; act: Act; sample?: History }) {
  const [history, setHistory] = useState<History | null>(sample ?? null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState<number | null>(null); // how many days are painted while replaying
  const [saying, setSaying] = useState("");
  const [waveFrame, setWaveFrame] = useState(0);
  const [confirmNew, setConfirmNew] = useState(false);
  const pick = useLinePicker();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (sample) return;
    api<History>("/api/history", { token: getToken() })
      .then(setHistory)
      .catch(() => setError("We couldn't load your progress just now. Please try again."));
  }, [sample, today.today.myCheckin]);

  useEffect(() => {
    if (history?.finished) setSaying(pick("finished", config?.talk.finished ?? TALK.finished));
    // Only when the history first arrives.
  }, [history?.finished]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  if (error) return <ErrorNote message={error} />;
  if (!history) return <p role="status">Loading your progress...</p>;

  const stats = personalStats(history.days.map((day) => day.mark));
  const badges = config?.badges ?? BADGES;
  const earned = badges.filter((badge) => stats.best >= badge.days).length;
  const segments = Math.round(stats.percent / 10);
  const mood = stats.percent >= 70 ? "proud" : "happy"; // always warm, never shaming
  const reduceMotion = () => wantsLessMotion();

  function pepTalk() {
    setSaying(pick("motivation", config?.talk.motivation ?? TALK.motivation));
    if (reduceMotion()) return;
    setWaveFrame(1);
    timers.current.push(setTimeout(() => setWaveFrame(2), 250), setTimeout(() => setWaveFrame(0), 500));
  }

  function replay() {
    if (reduceMotion() || !history) return;
    setShown(0);
    history.days.forEach((_, index) => timers.current.push(setTimeout(() => setShown(index + 1), 90 * (index + 1))));
    timers.current.push(setTimeout(() => setShown(null), 90 * (history.days.length + 2)));
  }

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Your progress</h1>
      <section aria-label="Your character" className="relative overflow-hidden border border-line rounded-2xl bg-[#ffe58a] shadow-sm">
        {history.finished && (
          <div aria-hidden="true">
            {[...CONFETTI, ...CONFETTI, ...CONFETTI].map((colour, index) => (
              <i
                key={index}
                className="confetti absolute -top-2 size-1.5"
                style={{ left: `${4 + index * 6.5}%`, background: colour, animationDelay: `-${((index * 0.37) % 2.4).toFixed(2)}s` }}
              />
            ))}
          </div>
        )}
        <div className="p-3 pb-0">
          <p role="status" className="border border-line rounded-2xl bg-white p-3 text-lg leading-snug font-bold">
            {saying || "Tap your character for a pep talk."}
          </p>
        </div>
        <div className="flex justify-center pt-3 pb-3">
          <button type="button" onClick={pepTalk} aria-label="Tap your character for a pep talk" className="press flex flex-col items-center">
            <PixelAvatar code={today.me.avatar} mood={mood} scale={4} wave={waveFrame} label={`Your character, looking ${mood}.`} />
            <span className="mt-1 text-lg font-semibold">You</span>
          </button>
        </div>
      </section>

      <Card title="My promise">
        <p className="border border-line rounded-2xl bg-white p-3">{history.promise}</p>
        <dl className="grid grid-cols-3 gap-2">
          {[
            { icon: "fire" as const, value: String(stats.current), label: "Streak" },
            { icon: "star" as const, value: String(stats.best), label: "Best" },
            { icon: "heart" as const, value: `${stats.percent}%`, label: "Done" },
          ].map((tile) => (
            <div key={tile.label} className="border border-line rounded-2xl bg-white p-2 text-center">
              <PixelIcon name={tile.icon} />
              <dd className="mt-1 text-xl font-bold">{tile.value}</dd>
              <dt>{tile.label}</dt>
            </div>
          ))}
        </dl>
      </Card>

      <WhyPanel why={today.me.why} />

      <Card title="Progress">
        <div role="img" aria-label={`${stats.percent}% of days done`} className="grid grid-cols-10 gap-1">
          {Array.from({ length: 10 }, (_, index) => (
            <i key={index} className={`h-4 border border-line rounded-md ${index < segments ? "bg-[#8fd37f]" : "bg-white"}`} />
          ))}
        </div>
        <p>
          {stats.done} of {stats.total} check-ins
        </p>
      </Card>

      <Card title="Your days">
        {history.days.length === 0 ? (
          <p>Your first day shows up here once you check in.</p>
        ) : (
          <>
            <div role="img" aria-label={`${stats.done} of ${stats.total} days done`} className="grid grid-cols-7 gap-1">
              {history.days.map((day, index) => (
                <i key={day.date} className={`aspect-square border border-line rounded-md ${shown === null || index < shown ? DAY_STYLE[day.mark] : "bg-white"}`} />
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-4">
              {(["done", "skipped", "missed"] as const).map((mark) => (
                <li key={mark} className="flex items-center gap-2 capitalize">
                  <i aria-hidden="true" className={`inline-block size-3.5 border border-line rounded-md ${DAY_STYLE[mark]}`} />
                  {mark}
                </li>
              ))}
            </ul>
            <button type="button" className={`${QUIET_BUTTON} text-left`} onClick={replay}>
              Replay my days
            </button>
          </>
        )}
      </Card>

      <Card title={`Badges ${earned}/${badges.length}`}>
        <ul className="grid grid-cols-3 gap-2">
          {badges.map((badge) => {
            const got = stats.best >= badge.days;
            return (
              <li key={badge.id} className={`border border-line rounded-2xl bg-white p-2 text-center leading-snug ${got ? "" : "border-dashed bg-paper text-muted"}`}>
                <span className={`block ${got ? "" : "opacity-50 grayscale"}`}>
                  <PixelIcon name={BADGE_ICONS[badge.id] ?? "badge"} size={32} />
                </span>
                {badge.name}
                <span className="sr-only">{got ? ", earned" : ", not yet"}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      {today.partner && (
        <Card title="Partner">
          <div className="flex items-center gap-3">
            <div className="shrink-0 border border-line rounded-2xl bg-[#ffc9dc]">
              <PixelAvatar code={today.partner.avatar} mood="caring" scale={2} />
            </div>
            <p>
              <span className="block text-lg font-semibold break-all">{today.partner.nickname}</span>
              is cheering you on.
            </p>
          </div>
        </Card>
      )}

      {confirmNew ? (
        <Card title="Start a new promise?">
          <p>This ends your current promise and partnership. Your partner will be matched with someone new.</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={() => act("/api/leave")}>
            Yes, start fresh
          </button>
          <button type="button" className={SECONDARY_BUTTON} onClick={() => setConfirmNew(false)}>
            Keep going
          </button>
        </Card>
      ) : (
        <button type="button" className={PRIMARY_BUTTON} onClick={() => setConfirmNew(true)}>
          New promise
        </button>
      )}
    </div>
  );
}
