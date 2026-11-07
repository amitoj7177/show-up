"use client";

import type { ReactNode } from "react";
import type { MascotMood } from "@/lib/rules";
import { PixelAvatar } from "./PixelAvatar";
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

const MOODS: { mood: MascotMood; label: string }[] = [
  { mood: "happy", label: "Checked in" },
  { mood: "proud", label: "On a streak" },
  { mood: "sad", label: "Skipped a day" },
  { mood: "annoyed", label: "Running late" },
  { mood: "mad", label: "Missed a day" },
  { mood: "furious", label: "Gone quiet" },
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
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-8 sm:py-20">
        <p className="font-semibold">{eyebrow}</p>
        <h2 id={`${id}-title`} className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl sm:leading-tight">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

// The public website, shown before you log in.
export function Landing({ onStart }: { onStart: (screen: "signup" | "login") => void }) {
  return (
    <div className="flex-1">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:bg-white focus:p-2">
        Skip to content
      </a>
      <header className="border-b border-line bg-card">
        <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <a href="/" className="flex items-center gap-2 text-xl font-bold">
            <img src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
            Promise Pals
          </a>
          <div className="flex items-center gap-2 sm:gap-6">
            <a href="#how" className="hidden font-semibold underline-offset-4 hover:underline md:inline">
              How it works
            </a>
            <a href="#clinics" className="hidden font-semibold underline-offset-4 hover:underline md:inline">
              For clinics
            </a>
            <a href="#trust" className="hidden font-semibold underline-offset-4 hover:underline md:inline">
              Privacy
            </a>
            <button type="button" onClick={() => onStart("login")} className="min-h-11 px-2 font-semibold underline underline-offset-4">
              Log in
            </button>
          </div>
        </nav>
      </header>

      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-8 sm:py-16 md:grid-cols-2">
          <div className="space-y-6">
            <p className="font-semibold">For anyone working on a health goal alone</p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl sm:leading-tight">Keep your health promises, together.</h1>
            <p className="text-xl">
              Promise Pals pairs you with a real person in your part of Calgary, working on a similar goal. You both prove it with a photo every day.
              Your pixel character cheers you on, and gets grumpy if you go quiet.
            </p>
            <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
              <a href="/?demo=1" className={SECONDARY_BUTTON}>
                See a demo
              </a>
            </div>
            <p className="text-muted">Free. Made in Calgary. One photo a day.</p>
          </div>
          <div className="px-card mx-auto w-full max-w-md overflow-hidden">
            <PixelScene code="h0-c1-s2-e1-o1-k3-a0" mood="happy" label="A pixel character waving hello in a sunny park." bubble="HI!" />
          </div>
        </section>

        <section aria-label="What the research says" className="border-t border-line bg-accent text-white">
          <ul className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-8 md:grid-cols-3">
            {FINDINGS.map((finding) => (
              <li key={finding.source}>
                <p className="text-4xl font-bold leading-tight text-white">{finding.figure}</p>
                <p className="mt-2 text-lg">{finding.text}</p>
                <a href={finding.href} className="mt-2 inline-block text-[#cfe0f5] underline underline-offset-4">
                  {finding.source}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <Section id="how" eyebrow="How it works" title="Three steps. One photo a day.">
          <ol className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="px-card flex flex-col items-center p-6 text-center">
                <span className="text-xl font-bold">Step {index + 1}</span>
                <div className="my-4">
                  <PixelAvatar code={step.avatar} mood={step.mood} scale={3} />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="moods" eyebrow="Your character" title="It reacts to how your week is going." tint>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {MOODS.map((item) => (
              <li key={item.mood} className="px-card flex flex-col items-center p-4 text-center">
                <PixelAvatar code="h1-c2-s3-e2-o2-k7-a1" mood={item.mood} scale={2} label={`Your character when ${item.label.toLowerCase()}.`} />
                <p className="mt-2 font-semibold">{item.label}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-lg">
            Skipping a rough day makes it sad, not mad, and keeps your streak safe. Need it calmer? Gentle mode turns the grumpiness off.
          </p>
        </Section>

        <Section id="clinics" eyebrow="For physio clinics and campus programs" title="Give your patients a code. See how they're doing, together.">
          <div className="grid gap-8 md:grid-cols-2">
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
            <div className="px-card space-y-3 p-6">
              <h3 className="text-xl font-bold">Run a clinic or program?</h3>
              <p>Create a group, share its code, and open your dashboard with a staff key.</p>
              <a href="/clinic" className={SECONDARY_BUTTON}>
                Open the clinic dashboard
              </a>
            </div>
          </div>
        </Section>

        <Section id="trust" eyebrow="Privacy and safety" title="Real people, kept safe." tint>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((item) => (
              <li key={item.title} className="px-card p-5">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2">{item.text}</p>
              </li>
            ))}
          </ul>
        </Section>

        <section className="border-t border-line bg-card">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-14 text-center sm:px-8">
            <h2 className="text-3xl font-bold leading-tight sm:text-2xl">Ready to make a promise?</h2>
            <div className="w-full max-w-xs">
              <button type="button" className={PRIMARY_BUTTON} onClick={() => onStart("signup")}>
                Get started
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-8 md:grid-cols-2">
          <div>
            <p className="text-xl font-bold">Promise Pals</p>
            <p className="mt-2 text-muted">Made at Hack the Change 2026, Calgary.</p>
          </div>
          <p className="text-muted">Promise Pals is not medical care. In an emergency, call 911.</p>
        </div>
      </footer>
    </div>
  );
}
