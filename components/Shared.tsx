import type { ReactNode } from "react";
import type { SupportLink, Why } from "@/lib/types";

export function Wordmark() {
  return (
    <p className="wordmark flex items-center gap-2 text-xl font-bold">
      <img src="/icon-192.png" alt="" width={32} height={32} className="size-8 rounded-lg" />
      Promise Pals
    </p>
  );
}

// The bar at the top of a screen, with an optional back button.
export function TitleBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="title-bar flex min-h-16 items-center justify-between gap-2 border-b border-line bg-card px-3 py-2">
      {onBack ? (
        <button type="button" aria-label="Back" onClick={onBack} className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-paper">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : (
        <span className="size-11 shrink-0" />
      )}
      <h1 className="text-center text-xl font-bold">{title}</h1>
      {right ?? <span className="size-11 shrink-0" />}
    </div>
  );
}

export function WhyPanel({ why, title = "Why? See how your goal was checked" }: { why: Why; title?: string }) {
  return (
    <details className="px-card p-4">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <dl className="mt-3 space-y-3">
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
    <footer className="space-y-2 pt-2 pb-4">
      <p className="font-semibold">Need support right now?</p>
      <ul className="space-y-1">
        {support.map((link) => (
          <li key={link.href}>
            <a className="px-link" href={link.href}>
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
    <section className="px-card space-y-3 p-5">
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

export const PRIMARY_BUTTON = "px-btn px-btn-y";
export const SECONDARY_BUTTON = "px-btn";
export const QUIET_BUTTON = "px-link block min-h-12 w-full py-2 text-center";
