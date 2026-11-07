import type { ReactNode } from "react";
import type { SupportLink, Why } from "@/lib/types";

export function Wordmark() {
  return <p className="font-display text-2xl font-semibold tracking-wide text-accent">Show Up</p>;
}

export function WhyPanel({ why, title = "Why? See how your goal was checked" }: { why: Why; title?: string }) {
  return (
    <details className="rounded-3xl bg-card p-5 shadow-sm">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <dl className="mt-4 space-y-3">
        <WhyRow label="What we checked" value={why.textChecked} />
        <WhyRow label="Result" value={why.result} />
        <WhyRow label="What your partner sees" value={why.partnerSees} />
        <WhyRow label="Personal details removed" value={why.removedPersonalInfo ? "Yes" : "None found"} />
        <WhyRow label="Checked by" value={why.source} />
        <WhyRow label="Checked at" value={new Date(why.checkedAt).toLocaleString("en-CA")} />
      </dl>
    </details>
  );
}

function WhyRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium break-words">{value}</dd>
    </div>
  );
}

export function SupportFooter({ support, notMedicalCare }: { support: SupportLink[]; notMedicalCare: string }) {
  return (
    <footer className="space-y-2 px-1 pt-2 pb-4">
      <p className="font-semibold">Need support right now?</p>
      <ul className="space-y-1">
        {support.map((link) => (
          <li key={link.href}>
            <a className="text-accent underline underline-offset-4" href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="text-muted">{notMedicalCare}</p>
    </footer>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-3xl bg-card p-5 shadow-sm">
      {title && <h2 className="text-xl font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-2xl bg-warn-soft p-4 font-medium">
      {message}
    </p>
  );
}

export function DemoLabel({ text }: { text: string }) {
  return <p className="rounded-full bg-accent-soft px-4 py-2 text-center font-semibold text-accent-dark">{text}</p>;
}

const BUTTON_BASE = "press min-h-14 w-full rounded-2xl px-5 py-3 text-center font-bold disabled:opacity-60";
export const PRIMARY_BUTTON = `${BUTTON_BASE} bg-accent text-white shadow-[0_4px_0_var(--color-accent-dark)]`;
export const SECONDARY_BUTTON = `${BUTTON_BASE} bg-accent-soft text-accent-dark`;
export const QUIET_BUTTON = "min-h-12 w-full rounded-2xl px-4 py-2 font-semibold text-accent-dark underline underline-offset-4";
