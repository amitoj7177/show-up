"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { MascotMood } from "@/lib/rules";
import { MOOD_BACKGROUND } from "@/lib/avatar";
import { PixelAvatar } from "./PixelAvatar";
import { CountUp, Reveal, useScrollY, useSectionProgress } from "./ScrollFx";
import { PixelScene } from "./PixelScene";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./Shared";

// Real, sourced findings only. Each one links to where it comes from.
const FINDINGS = [
  {
    figure: "Up to 50%",
    text: "of people don't keep up their home exercise programs.",
    source: "JMIR mHealth and uHealth, 2018",
    href: "https://mhealth.jmir.org/2018/3/e47/PDF",
  },
  {
    figure: "50%",
    text: "higher likelihood of survival for people with strong social ties, across 148 studies.",
    source: "Holt-Lunstad et al., PLOS Medicine, 2010",
    href: "https://doaj.org/article/c9833ba608474b048444b92ae7ee48ad",
  },
  {
    figure: "138 trials",
    text: "found tracking progress helps people reach goals, more so when progress is reported.",
    source: "Harkin et al., Psychological Bulletin, 2016",
    href: "https://eprints.whiterose.ac.uk/id/eprint/91437/",
  },
];

const STEPS: { mood: MascotMood; avatar: string; title: string; text: string }[] = [
  { mood: "waiting", avatar: "h0-c1-s2-e1-o1-k3-a0", title: "Make a promise", text: "Any health goal counts. Physio, sleep, getting outside. You pick a daily time." },
  { mood: "caring", avatar: "h3-c3-s1-e2-o0-k9-a0", title: "Meet your partner", text: "A real person in your part of Calgary, on a similar goal. See their name, photo and why it matters." },
  { mood: "proud", avatar: "h2-c5-s3-e1-o1-k7-a1", title: "Prove it daily", text: "Snap a photo of what you did. Your partner confirms it, and your streak grows together." },
];

const MOODS: { mood: MascotMood; label: string; line: string }[] = [
  { mood: "happy", label: "Checked in", line: "You showed up. Your character is pleased." },
  { mood: "proud", label: "On a streak", line: "Three days in a row with your partner. Sparkles." },
  { mood: "sad", label: "Skipped a day", line: "Rough days happen. It's sad, never mad, and your streak stays safe." },
  { mood: "annoyed", label: "Running late", line: "Your check-in time has passed. Foot tapping begins." },
  { mood: "mad", label: "Missed a day", line: "You missed yesterday. Your partner noticed. So did it." },
  { mood: "furious", label: "Gone quiet", line: "Days of silence? Steam. One tap and you're friends again." },
];

// What makes Promise Pals accessible. Each item is something the app really does.
const ACCESSIBLE = [
  { title: "Any goal counts", text: "Seated stretches, physio, getting outside. Not just steps, so wheelchair users and people in recovery count too." },
  { title: "Rough days are allowed", text: "Skip a day without breaking your streak. Your character gets sad, never angry, and gentle mode turns the grumpiness off." },
  { title: "Proof your way", text: "A photo, your Fitbit, or neither. You can always check in without a camera." },
  { title: "Works with screen readers", text: "Real buttons and labels, every picture described, and it works with just a keyboard." },
  { title: "Big, plain text", text: "Large text, clear contrast and short, simple words throughout." },
  { title: "Calm when you need it", text: "If your phone is set to reduce motion, every animation switches off." },
];

const TRUST = [
  { title: "Real people, first names only", text: "Partners see your first name, photo and Calgary community. Never your email, last name or address." },
  { title: "Proof you can trust", text: "Check in with a photo of what you did. Your partner confirms it, and every photo is checked first." },
  { title: "No chat, no pressure", text: "Partners can only send kind, pre-written messages. Report or leave in one tap." },
  { title: "Adults only, every goal checked", text: "You must be 18 or older. AI checks each goal and photo before a partner sees it, and a \u201cWhy?\u201d panel shows how it decided." },
];

function Section({ id, eyebrow, title, children, tint = false }: { id?: string; eyebrow: string; title: string; children: ReactNode; tint?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`border-t border-line ${tint ? "bg-accent-soft" : ""}`}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <p className="font-semibold">{eyebrow}</p>
        <Reveal>
        <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-3xl font-bold leading-tight">
          {title}
        </h2>
        </Reveal>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

// The public website, shown before you log in.
// A thin bar under the header that fills as you read down the page.
function ReadingBar({ scrollY }: { scrollY: number }) {
  const [total, setTotal] = useState(1);
  useEffect(() => {
    const phone = document.getElementById("phone-scroll");
    const target = phone && phone.scrollHeight > phone.clientHeight ? phone : document.documentElement;
    setTotal(Math.max(1, target.scrollHeight - target.clientHeight));
  }, [scrollY]);
  return <div aria-hidden="true" className="reading-bar" style={{ transform: `scaleX(${Math.min(1, scrollY / total)})` }} />;
}

// The character stays pinned while its mood changes as you scroll, like an Apple product page.
function MoodStory() {
  const scrollY = useScrollY();
  const { ref, progress } = useSectionProgress<HTMLElement>(scrollY);
  // All six moods appear within the first 90% of the scroll, so the last one gets time on screen.
  const index = Math.min(MOODS.length - 1, Math.floor(Math.min(1, progress / 0.9) * MOODS.length));
  const current = MOODS[index];
  return (
    <section ref={ref} id="moods" aria-labelledby="moods-title" className="mood-story border-t border-line">
      <div className="mood-story-pin" style={{ background: MOOD_BACKGROUND[current.mood] }}>
        <p className="font-semibold">Your character</p>
        <h2 id="moods-title" className="mt-2 text-3xl font-bold">
          It reacts to how your week is going.
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
            <a href="#how" className="hidden">
              How it works
            </a>
            <a href="#clinics" className="hidden">
              For clinics
            </a>
            <a href="#trust" className="hidden">
              Privacy
            </a>
            <button type="button" onClick={() => onStart("login")} className="min-h-11 px-2 font-semibold underline underline-offset-4">
              Log in
            </button>
          </div>
        </nav>
        <ReadingBar scrollY={scrollY} />
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12">
          <Reveal className="space-y-6">
            <p className="font-semibold">For Calgarians who struggle to stick to their health goals</p>
            <h1 className="text-4xl font-bold leading-tight">Keep your health promises, together.</h1>
            <p className="text-xl">
              Promise Pals pairs Calgarians who struggle to stick to their health goals with a nearby partner, and proves every check-in with a photo or their Fitbit.
            </p>
            <p className="text-lg font-semibold">Built for people step counters leave out.</p>
            <div className="grid gap-3">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
              <a href="/?demo=1" className={SECONDARY_BUTTON}>
                See a demo
              </a>
            </div>
            <p className="text-muted">Free. Accessible. Made in Calgary.</p>
          </Reveal>
          <div
            className="px-card mx-auto w-full max-w-md overflow-hidden"
            style={{ transform: `translateY(${lift * 0.18}px) scale(${1 - lift / 2600}) rotate(${-lift / 260}deg)`, opacity: 1 - lift / 1400 }}
          >
            <PixelScene code="h0-c1-s2-e1-o1-k3-a0" mood="happy" label="A pixel character waving hello in a sunny park." bubble="HI!" />
          </div>
        </section>

        <section aria-label="What the research says" className="border-t border-line bg-accent text-white">
          <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
            {FINDINGS.map((finding) => (
              <li key={finding.source}>
                <CountUp text={finding.figure} className="stat-figure text-4xl font-bold leading-tight text-white" />
                <p className="mt-2 text-lg">{finding.text}</p>
                <a href={finding.href} className="mt-2 inline-block text-[#cfe0f5] underline underline-offset-4">
                  {finding.source}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Section id="how" eyebrow="How it works" title="Three steps. One photo a day.">
          <ol className="grid gap-6">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <Reveal delay={index * 120} className="px-card flex flex-col items-center p-6 text-center">
                <span className="text-xl font-bold">Step {index + 1}</span>
                <div className="my-4">
                  <PixelAvatar code={step.avatar} mood={step.mood} scale={3} />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="accessible" eyebrow="Accessible by design" title="Built for people step counters leave out." tint>
          <ul className="grid gap-4">
            {ACCESSIBLE.map((item, index) => (
              <li key={item.title}>
                <Reveal delay={index * 80} className="px-card p-5">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2">{item.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>

        <MoodStory />

        <Section id="clinics" eyebrow="For physio clinics and campus programs" title="Give your patients a code. See how they're doing, together.">
          <div className="grid gap-8">
            <ul className="space-y-4 text-lg">
              <li>
                <strong>Patients pair up within your program.</strong> Same clinic, first names only.
              </li>
              <li>
                <strong>You see totals, never people.</strong> Check-in rates and skipped days, and only once 5 people have joined.
              </li>
              <li>
                <strong>Built for Calgary first.</strong> We&apos;re looking for a local clinic or campus program to pilot with.
              </li>
            </ul>
            <Reveal className="px-card space-y-3 p-6">
              <h3 className="text-xl font-bold">Run a clinic or program?</h3>
              <p>Create a group, share its code, and open your dashboard with a staff key.</p>
              <a href="/clinic" className={SECONDARY_BUTTON}>
                Open the clinic dashboard
              </a>
            </Reveal>
          </div>
        </Section>

        <Section id="trust" eyebrow="Privacy and safety" title="Real people, kept safe." tint>
          <ul className="grid gap-4">
            {TRUST.map((item, index) => (
              <li key={item.title}>
                <Reveal delay={index * 100} className="px-card p-5">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2">{item.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>

        <section className="cta-band border-t border-line bg-card">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center">
            <h2 className="text-3xl font-bold leading-tight">Ready to make a promise?</h2>
            <div className="w-full max-w-xs">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10">
          <div>
            <p className="text-xl font-bold">Promise Pals</p>
            <p className="mt-2 text-muted">Made at Hack the Change 2026, Calgary.</p>
          </div>
          <p className="text-muted">Promise Pals is not medical care. In an emergency, call 911.</p>
          <a href="/privacy" className="px-link">
            Privacy: what we keep and who sees it
          </a>
        </div>
      </footer>
    </div>
  );
}
