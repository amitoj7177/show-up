import { Card, TitleBar } from "@/components/Shared";

export const metadata = { title: "Privacy - Promise Pals" };

const ROWS: { what: string; where: string; who: string }[] = [
  { what: "Email and password", where: "Auth0 (Canada region)", who: "Only Auth0. We never see your password, and we don't keep your email." },
  { what: "First name, photo, Calgary community", where: "Our database (Tiger Data)", who: "You and your current partner." },
  { what: "Your goal and why it matters", where: "Our database (Tiger Data)", who: "You. Your partner sees the checked, cleaned-up version." },
  { what: "Check-ins and proof photos", where: "Our database (Tiger Data)", who: "You and your current partner." },
  { what: "Fitbit steps (only if you connect)", where: "Read from Google Health when you check in", who: "You and your partner see today's step count. Nothing else is read." },
  { what: "Clinic totals (only with a clinic code)", where: "Calculated when staff look", who: "Clinic staff see totals only, once 5 people have joined. Never names." },
];

// What we store, where it lives, who can see it, and how to delete it. In plain language.
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-5">
      <div className="px-card overflow-hidden">
        <TitleBar title="Your privacy" />
        <div className="space-y-5 p-5">
          <p className="text-lg">Promise Pals keeps as little as possible, and you can delete all of it at any time.</p>

          <Card title="What we keep, and who sees it">
            <ul className="space-y-4">
              {ROWS.map((row) => (
                <li key={row.what}>
                  <p className="font-bold">{row.what}</p>
                  <p>
                    <span className="text-muted">Stored in:</span> {row.where}
                  </p>
                  <p>
                    <span className="text-muted">Who sees it:</span> {row.who}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Never shared">
            <p>Your email, last name, exact address and location are never shown to your partner or anyone else. We don&apos;t sell or share data.</p>
          </Card>

          <Card title="How AI is used">
            <p>
              Google Gemini checks your goal, your &ldquo;why it matters&rdquo; line and your photos before a partner sees them. It removes personal details
              and blocks anything unsafe. It never writes messages, gives health advice, or decides your streak or partner.
            </p>
          </Card>

          <Card title="Delete everything">
            <p>
              Go to <strong>Me → Delete my account and data</strong>. We remove your profile, photos, goals, Fitbit connection and login from our
              database straight away. Your partner keeps empty check-in marks so their streak still adds up, with nothing about you in them.
            </p>
            <p className="text-muted">Your email login stays with Auth0 until the team removes it. Ask us and we will.</p>
          </Card>

          <p className="text-muted">Promise Pals is not medical care. In an emergency, call 911.</p>
          <a href="/" className="px-link block">
            Back to Promise Pals
          </a>
        </div>
      </div>
    </main>
  );
}
