# Promise Pals

**Find a health partner near you, and keep each other going.**

Live app: https://hackathon-gilt-iota.vercel.app · Built at Hack the Change YYC 2026 (Prompt 1: health, social connection and well-being).

## The problem

Lots of Calgarians want to stick to a health goal (physio exercises, a daily walk, getting outside), but most give up. Up to half of people don't keep up their home exercise programs ([JMIR mHealth and uHealth, 2018](https://mhealth.jmir.org/2018/3/e47/PDF)). Having another person helps: strong social ties are linked to 50% better survival odds across 148 studies ([Holt-Lunstad et al., PLOS Medicine, 2010](https://doaj.org/article/c9833ba608474b048444b92ae7ee48ad)). People are looking for a partner, but there's no easy way to find each other.

## Who it's for

Calgarians who struggle to stick to their health goals, including the people step counters leave out: wheelchair users, people with walking aids, and people living with chronic pain or limited energy.

## What it does

- **Find a partner nearby, fast.** The Nearby board shows real people in Calgary who are looking right now (first name, community, distance, goal). Tap "Ask to team up", they see it within seconds and say yes. Or invite someone you know with a link. Nobody there after 30 seconds? A clearly labelled practice partner steps in, so you're never stuck waiting.
- **Check in every day, with real proof.** A photo your partner confirms, or your Fitbit: steps, workouts it detects on its own, and active minutes from heart rate.
- **Accountability that feels human.** Your pixel character gets annoyed, mad, then furious if you let your partner down, but rough days are allowed and never break your streak. After 2 silent days you can get a new partner.

## Screenshots

Open the live app, or tap **See a demo** for a labelled sample run with an instant match. (Add screenshots here.)

## Accessibility

- Optional "How do you move?" so you can find someone who moves like you.
- Fitbit proof from heart rate (active zone minutes), not only steps.
- Easy reading switches: bigger text, stronger contrast, less motion. The phone's own reduce-motion setting is respected too.
- Real buttons and labels, every character's mood described in words, never colour alone, keyboard-friendly, 18px body text, WCAG AA contrast.
- Every screen is checked with axe-core in an automated browser: 0 issues.

## Privacy and safety

- Partners see only your first name, photo and Calgary community. Never your email, address or exact location. Distance is measured between community centres.
- No free chat (only kind, pre-written messages), no meet-ups through the app, 18+ only, report or leave in one tap.
- Passwords are handled by Auth0. We never store them, and we don't keep your email.
- Delete your account and data at any time. The privacy page (`/privacy`) explains what we keep and who sees it.

## Data sources

| Source | What we use it for |
|---|---|
| [City of Calgary Open Data](https://data.calgary.ca) (community boundaries `surr-xmvs`) | Calgary communities and distances between them |
| [Google Health API](https://developers.google.com/health) (Fitbit) | Today's steps, workouts and active zone minutes, only if you connect |
| Research in "The problem" above | The figures on the landing page, each linked to its source |

Everything shown as real is real. The demo mode uses sample people and says so on screen.

## Tech stack

Next.js 16 (App Router) with React 19 and TypeScript · Tailwind CSS · Postgres on Tiger Data (via `pg`) · Auth0 (email and password) · Google Health API (Fitbit) · Google Gemini (`gemini-3.5-flash-lite`) · hosted on Vercel.

## How to run it locally

```bash
npm install
cp .env.example .env.local   # then fill in the keys
node scripts/setup-db.mjs    # creates the database tables
npm run dev                  # http://localhost:3000
npm test                     # rule tests
```

## AI usage disclosure

- **Development:** the code was written with Claude Code (Anthropic) during the event, directed and tested by our team. Our team decided the idea, the product design, every feature and change, and tested the app on real phones.
- **In the app:** Google Gemini checks three things before a partner sees them: a goal (safe, not a weight goal, rewritten in plain words without personal details), the "why it matters" line, and photos (safe, with a short description). It only works on what the person typed or uploaded. It never writes messages, gives health advice, chooses partners, or decides streaks or numbers. Every AI decision has a "Why?" panel.
- **Characters and design:** the pixel characters and the app mockups were made by our teammates. **[Fill in: which tools they used, for example "a drag-and-drop pixel editor" or "mockups drafted with Claude".]**
- **What our team did:** the idea and problem research, mentor interviews, product and character design, choosing the data and sponsor tools, testing, the video and the pitch.

## What's next, and who pays

- **Launch through Calgary physio clinics and community programs**, so the board is full from day one. Their patients don't keep up home exercises, and clinics would pay a small fee for a tool that helps. It costs cents per user to run.
- A native iPhone app to read Apple Health directly.
- Google's verification for Fitbit, so anyone can connect (testing mode allows 100 invited users).

## Team

[Fill in: team members and roles]
