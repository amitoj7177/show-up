"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ReadingSettings } from "./ReadingSettings";
import type { MascotMood } from "@/lib/rules";
import { MOOD_BACKGROUND } from "@/lib/avatar";
import { PixelAvatar } from "./PixelAvatar";
import { CountUp, Reveal, useScrollY, useSectionProgress } from "./ScrollFx";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./Shared";

const FINDINGS = [
  {
    figure: "Up to 50%",
    text: "of people don't keep up their home exercises.",
    source: "JMIR mHealth and uHealth, 2018",
    href: "https://mhealth.jmir.org/2018/3/e47/PDF",
  },
  {
    figure: "50%",
    text: "better survival odds with strong social ties.",
    source: "Holt-Lunstad et al., PLOS Medicine, 2010",
    href: "https://doaj.org/article/c9833ba608474b048444b92ae7ee48ad",
  },
];

const STEPS: { mood: MascotMood; avatar: string; title: string; text: string }[] = [
  { mood: "waiting", avatar: "h0-c1-s2-e1-o1-k3-a0", title: "Make a promise", text: "Any health goal. Physio, a walk, sleep." },
  { mood: "caring", avatar: "h3-c3-s1-e2-o0-k9-a0", title: "Team up nearby", text: "Pick a real person near you who's looking too." },
  { mood: "proud", avatar: "h2-c5-s3-e1-o1-k7-a1", title: "Prove it daily", text: "A photo or your Fitbit." },
];

const MOODS: { mood: MascotMood; label: string; line: string }[] = [
  { mood: "happy", label: "Checked in", line: "You showed up." },
  { mood: "proud", label: "On a streak", line: "Three days in a row together." },
  { mood: "sad", label: "Skipped a day", line: "Sad, never mad. Your streak stays safe." },
  { mood: "annoyed", label: "Running late", line: "Your check-in time has passed." },
  { mood: "mad", label: "Missed a day", line: "Your partner noticed. So did it." },
  { mood: "furious", label: "Gone quiet", line: "One check-in and you're friends again." },
];

const ACCESSIBLE = [
  "Find someone who moves like you: wheelchair, walking aid, chronic pain",
  "Fitbit proof from heart rate, not just steps",
  "Rough days don't break your streak",
  "Screen readers, keyboard, big text, strong contrast, less motion",
];

function MatchScene() {
  return (
    <div
      role="img"
      aria-label="Two pixel characters walk in from each side and team up."
      className="px-card mx-auto w-full max-w-md overflow-hidden"
      style={{ background: "#bfe6ff" }}
    >
      <div aria-hidden="true" className="relative flex h-80 items-end justify-center gap-2 px-4 pb-4">
        <div className="match-left">
          <PixelAvatar code="h1-c2-s3-e2-o2-k7-a1" mood="happy" scale={4} />
        </div>
        <p className="match-heart absolute top-4 left-1/2 -translate-x-1/2 border border-line bg-[#fffc00] px-3 py-1 text-lg font-bold whitespace-nowrap">
          Team up!
        </p>
        <div className="match-right">
          <PixelAvatar code="h3-c3-s1-e2-o0-k9-a0" mood="happy" scale={4} />
        </div>
      </div>
      <p aria-hidden="true" className="border-t border-line bg-white p-3 text-center font-bold">
        Maya + Jordan · 2 km apart · Both doing physio
      </p>
    </div>
  );
}

function Section({ id, eyebrow, title, children, tint = false }: { id?: string; eyebrow: string; title: string; children: ReactNode; tint?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`border-t border-line ${tint ? "bg-accent-soft" : ""}`}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="font-semibold">{eyebrow}</p>
        <Reveal>
        <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-3xl font-bold leading-tight">
          {title}
        </h2>
        </Reveal>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function TickList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2">
      {items.map((item) => (
        <li key={item} className="px-card flex items-start gap-3 p-4 text-lg font-semibold">
          <span aria-hidden="true" className="shrink-0">
            {"\u2713"}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ReadingBar({ scrollY }: { scrollY: number }) {
  const [total, setTotal] = useState(1);
  useEffect(() => {
    const phone = document.getElementById("phone-scroll");
    const target = phone && phone.scrollHeight > phone.clientHeight ? phone : document.documentElement;
    setTotal(Math.max(1, target.scrollHeight - target.clientHeight));
  }, [scrollY]);
  return <div aria-hidden="true" className="reading-bar" style={{ transform: `scaleX(${Math.min(1, scrollY / total)})` }} />;
}

function MoodStory() {
  const scrollY = useScrollY();
  const { ref, progress } = useSectionProgress<HTMLElement>(scrollY);

  const index = Math.min(MOODS.length - 1, Math.floor(Math.min(1, progress / 0.9) * MOODS.length));
  const current = MOODS[index];
  return (
    <section ref={ref} id="moods" aria-labelledby="moods-title" className="mood-story border-t border-line">
      <div className="mood-story-pin" style={{ background: MOOD_BACKGROUND[current.mood] }}>
        <p className="font-semibold">Your character</p>
        <h2 id="moods-title" className="mt-2 text-3xl font-bold">
          Let it down, and it notices.
        </h2>
        <div className="mood-story-stage">
          <PixelAvatar key={current.mood} code="h1-c2-s3-e2-o2-k7-a1" mood={current.mood} scale={5} animate label={`Your character when ${current.label.toLowerCase()}.`} />
        </div>
        <p className="text-xl font-bold" aria-live="polite">
          {current.label}
        </p>
        <p className="mt-1 text-lg">{current.line}</p>
        <ol className="mt-4 flex justify-center gap-2" aria-hidden="true">
          {MOODS.map((item, dot) => (
            <li key={item.mood} className={`size-3 border-2 border-ink ${dot === index ? "bg-ink" : "bg-white"}`} />
          ))}
        </ol>
        <p className="mt-3 text-muted">Keep scrolling</p>
      </div>
      <ul className="sr-only">
        {MOODS.map((item) => (
          <li key={item.mood}>
            {item.label}: {item.line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Landing({ onStart }: { onStart: (screen: "signup" | "login") => void }) {
  const scrollY = useScrollY();
  const lift = Math.min(scrollY, 700);
  return (
    <div className="landing flex-1">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="site-header sticky top-0 z-20 border-b border-line bg-card">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <img src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
            Promise Pals
          </a>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onStart("login")} className="min-h-11 px-2 font-semibold underline underline-offset-4">
              Log in
            </button>
          </div>
        </nav>
        <ReadingBar scrollY={scrollY} />
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10">
          <Reveal className="space-y-5">
            <p className="font-semibold">For Calgarians who struggle to stick to their health goals</p>
            <h1 className="leading-tight">Find a health partner near you.</h1>
            <p className="text-xl">Team up with someone nearby, check in every day, and prove it.</p>
            <div className="grid gap-3">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
              <a href="/?demo=1" className={SECONDARY_BUTTON}>
                See a demo
              </a>
            </div>
          </Reveal>
          <div style={{ transform: `translateY(${lift * 0.15}px)`, opacity: 1 - lift / 1400 }}>
            <MatchScene />
          </div>
        </section>

        <section aria-label="What the research says" className="border-t border-line bg-accent text-white">
          <ul className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
            {FINDINGS.map((finding) => (
              <li key={finding.source}>
                <CountUp text={finding.figure} className="stat-figure leading-tight text-white" />
                <p className="mt-1 text-lg">{finding.text}</p>
                <a href={finding.href} className="mt-1 inline-block text-[#cfe0f5] underline underline-offset-4">
                  {finding.source}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Section id="how" eyebrow="How it works" title="Three steps.">
          <ol className="grid gap-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 120} className="px-card flex items-center gap-4 p-4">
                  <PixelAvatar code={step.avatar} mood={step.mood} scale={2} />
                  <div>
                    <h3 className="text-xl font-bold">
                      {index + 1}. {step.title}
                    </h3>
                    <p>{step.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        <MoodStory />

        <Section id="accessible" eyebrow="Accessible by design" title="We built this for the people most apps leave out." tint>
          <TickList items={ACCESSIBLE} />
          <div className="px-card mt-4 p-5">
            <h3 className="mb-3 text-lg font-bold">Try it: easy reading</h3>
            <ReadingSettings />
          </div>
        </Section>

        <section className="cta-band border-t border-line bg-card">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-12 text-center">
            <h2 className="leading-tight">Ready to team up?</h2>
            <div className="w-full max-w-xs">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
