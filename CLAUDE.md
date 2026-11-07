> **Taking over?** Read `docs/HANDOFF.md` first. It holds the full event context, every decision, the code map, setup, and what's left. Where it disagrees with older notes below, HANDOFF.md wins.

## The situation
- 24-hour in-person hackathon at UCalgary, run by Code the Change YYC (MLH-supported).
- STARTS: Saturday Nov 7, 9:00 AM. SUBMISSION DEADLINE: Sunday Nov 8, 11:30 AM Alberta time, on Devpost. Late or incomplete = rejected.
- Team of 3. I'm the product/design/pitch lead and the only person using Claude Code. I can read and debug code but can't write it from scratch. You write the code; I test and decide. My two teammates do data research, design assets, phone testing, the Devpost page, the video and the pitch.

## Official rules
- All design, code, Git repositories and hardware must be created during the event. Pre-existing libraries, frameworks and open-source tools are fine. No Figma-only submissions.
- AI tools are allowed, but the project must be original work and AI usage MUST be disclosed. Reskins of existing AI tools, or not disclosing AI, can mean disqualification. So the app must NOT be "a chatbot with a prompt". The core value is the workflow + real data; Gemini is one small part.
- Devpost title format: `Team ID - Team Name - Project Name`. Must include a project description, team members, a 2–5 min demo video, and links judges can open (public repo, public/unlisted video, live URL).
- Presentation: 3 minutes + 2 minutes Q&A, hard cutoff. All team members present.

## Judging
Criteria: Innovation & Creativity, Impact & Relevance to Prompt, Feasibility & Scalability, Technical Execution, UX & Design. The site also lists three sponsor criteria; they may be scored on every project, so we hit all three:
1. Benevity – Best Local Impact: solves a real problem in the Calgary community and could last.
2. Clio – Best in Accessibility / Trust & Transparency: accessible to diverse users, protects privacy, shows how decisions are made, responsible design.
3. Voltex – Best Use of Real-World Energy Data: real published or measured energy data (e.g. AESO). Made-up, sample or AI-generated data does NOT qualify. Live data is a bonus.
MLH prizes we can add if they fit: Gemini API (we'll use it), GoDaddy Registry domain, Auth0, Tiger Data, Vultr.

Judging panel: about 8 finance/insurance people (RBC, Bridgewater Bank, Morgan Stanley, AMA), who care about who pays, cost to run, and how it gets deployed. About 4 energy people (Energy Toolbase ×3, CNRL), who know AESO data well, so every number must be real and correctly labelled. Also TELUS, Calgary Airports, ZeroKey (hardware), Benevity and Clio.

What won in past years: a cheap hardware piece + web app, a very narrow slice of a problem, built for the nonprofit/frontline WORKER rather than the person in need, real open data, polished design. What lost: generic AI chatbots (six legal chatbots lost in 2024).

## Hard rules
1. Real data only. Never invent, simulate or AI-generate numbers that are shown as real. If an API fails, show the last real snapshot we saved, labelled "Snapshot from <time>".
2. The AI explains and drafts; it never makes up figures. Gemini only works from data we pass it. Every AI output has a "Why?" panel listing the exact data points it used, their source and timestamp.
3. Accessibility is a feature: WCAG AA contrast, body text ≥ 18px, real button/label elements, keyboard navigable, visible focus states, aria-labels on icon buttons, plain language (grade 6–8), works well on a phone.
4. Privacy: store no personal information unless the feature needs it. If we store anything, say so on screen in one line.
5. No logins unless the prompt truly needs staff accounts. If it does, use Auth0.
6. Keep it small. Only build the current step. No extra features, no refactors I didn't ask for, no stack changes.
7. Secrets live in .env.local only, are read only in server code, and are never committed. Keep .env.example up to date.

## Stack (don't change it without asking)
- Next.js (App Router) + TypeScript + Tailwind CSS. One repo, one app. Deploy on Vercel.
- Every external API call goes through a route handler in app/api/... so keys stay server-side and we avoid CORS.
- AI: Google Gemini via the @google/genai package. Use the current fast Flash model. Check the Gemini docs for the exact model name instead of guessing. Low temperature; structured JSON output when we need fields.
- Charts: Recharts.
- Database: none by default. If we need stored time-series, use Tiger Data (Postgres + TimescaleDB) via `pg`. Ask before adding.

## Data sources
- AESO: public API gateway at https://apimgw.aeso.ca/public, auth via an `API-KEY` header (env AESO_API_KEY). It has pool price, system marginal price, current supply & demand (generation by fuel type and asset), load forecast, interchange and outages. DO NOT guess endpoint paths. If you can't confirm a path from the AESO API docs, stop and ask me to paste the docs for that endpoint. A no-key fallback is the legacy AESO ETS reports at ets.aeso.ca (e.g. the Current Supply Demand report). Confirm the URL before using it.
- Calgary Open Data: Socrata SODA API at https://data.calgary.ca/resource/<dataset-id>.json with SoQL ($where, $limit, $order). No key needed. Never invent a dataset ID. Ask me or my teammates to confirm it.
- Weather: Open-Meteo forecast API (no key) or Environment Canada.
- List every source in lib/sources.ts (name, URL, licence, what we use it for). The UI and README both read from it.

## Demo safety (the venue WiFi will be bad)
- Save real API responses into snapshots/ with their fetch timestamp.
- Every data route tries live data first, then falls back to the latest snapshot, and returns { data, source: "live" | "snapshot", fetchedAt }.
- The UI shows a small "Live" or "Snapshot from <time>" badge.
- A `?demo=1` query param forces snapshot mode, so the demo works with no internet.

## Design
- Mobile-first, clean, confident. One accent colour, lots of white space, large type.
- Every screen has loading, empty and error states. No raw JSON or stack traces in the UI.
- The first screen makes the problem and the one moment we fix obvious in 3 seconds, and names the user (e.g. "For shelter coordinators").

## How to work with me
- Small steps. At the end of EVERY step, tell me:
  1. what changed (files, one line each),
  2. exactly how to test it (the command + what I should see),
  3. the git commit command.
  Then STOP and wait for me to type "next" (or give feedback).
- Plain English. No lectures.
- If something is ambiguous, pick the simplest option, tell me what you picked, and continue. Only ask when a choice is expensive to undo, or when you need something only I can provide (API keys, docs, logins).
- Before installing a package, say what it's for in one line.
- Run `npm run build` before telling me something is ready to deploy. Fix type errors yourself.
- When I paste an error: give the fix and one sentence on why. Nothing else.
- Never run destructive commands (rm -rf, git reset --hard, force push) without asking.
- At the start of every step, run `date` and check where we are against the schedule. If we're behind, tell me in one line what to cut.

## Schedule (clock times, Alberta)
- Sat 9:00–10:30: opening, prompt reveal, pick the idea, write the spec.
- by Sat 11:00: scaffold + a "hello" page deployed on Vercel (live URL).
- by Sat 2:00 PM: screen 1 working with REAL data, deployed. Non-negotiable.
- Sat 2:00 PM–10:00 PM: screens 2 and 3 + the AI "Why?" panel.
- Sat 10:00 PM–Sun 1:00 AM: accessibility pass, snapshots + ?demo=1, sponsor add-ons (domain, Tiger Data, Auth0 only if they fit).
- Sun 1:00–3:00 AM: bug fixes only.
- Sun 3:00 AM: FEATURE FREEZE. Nothing new after this.
- Sun 3:00–7:00 AM: polish, README, Devpost write-up, record the demo video.
- Sun 7:00–9:30 AM: pitch + Q&A practice. FIRST SUBMISSION BY 9:30 AM.
- Sun 9:30–11:00 AM: final fixes, re-submit. Done by 11:00 AM, not 11:29.

## README must include
Problem (one real person, one moment) · who uses it · what it does (3 bullets) · screenshots · data sources with links · accessibility & privacy notes · tech stack · how to run locally · what's next / who would deploy it and who pays · team.
Plus an "AI Usage Disclosure" section:
- Development: code written with Claude Code (Anthropic) during the event, directed and tested by the team.
- In the app: Google Gemini is used for <exactly what>, only on data we pass it; it never generates the figures shown.
- What the team did: idea, user research, product design, data selection, testing, the pitch.

## Added during the event
- Official prompt 1: "How can we leverage technology to promote health, social connection, and well-being in our communities?"
- Official prompt 2: "How can we leverage technology to help people develop in-demand skills and build meaningful networks in a rapidly changing job market?"
- Slide note: "Participants are encouraged to think creatively and develop solutions that address at least one of these critical issues."
- Amitoj: the project cannot be fully vibecoded. The team needs real hands-on work of its own, and the AI Usage Disclosure must describe accurately who built what.
- Official rubric (from the opening slide):
  - Innovation & Creativity: Is the idea original or a fresh take on existing solutions? Does it creatively apply technology to urban challenges (e.g., housing, mobility, disaster resilience, inclusivity)?
  - Impact & Relevance to Prompt: Does the solution clearly address the challenge? Could it meaningfully improve lives?
  - Feasibility & Scalability: Is the solution practical given real constraints (budget, infrastructure, etc.)? Could it scale beyond a demo into a real city/community setting?
  - Technical Execution: Quality of the implementation (working prototype, technical depth, stability)? Use of appropriate technology stack. Is the solution technically sound and well-built?
  - User Experience & Design: Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?
- Amitoj: use sponsor tools only where the product truly needs them. Don't build the project around pleasing sponsors.
- Official event facts (organizer deck + hackthechangeyyc.ca):
  - AI rule, word for word: "AI tools are allowed, but projects must demonstrate original work. Fully 'vibe-coded' projects may not pass prescreening."
  - Prescreen needs: Devpost title format, 2-5 min video, GitHub link, a Satisfactory score on every rubric criterion, and the project must appear complete. Violations mean no live judging.
  - Team size 2-5. Sunday: submissions close 11:30 AM, prescreens done 12:30 PM, judging 12:45-4:00 PM, winners 4:45 PM.
  - Prizes: 1st $5,000, 2nd $3,000, 3rd $2,000, with half of each donated to charity. Side pots: Voltex energy data $500 cash; Benevity local impact $100 cash + $100 to charity; Clio accessibility $100 cash.
  - MLH prizes listed: GoDaddy Registry, Gemini API, Vultr, Solana, Auth0, Tiger Data, Entire.
  - Sponsored resources: Arduino hardware, Keenable.ai credits, n8n.io credits, AWS credits.
  - Listed APIs: Adzuna, Badgr, Discord, Fitbit, GitHub REST, Google Healthcare, Open Data Canada Health, Open edX, OpenReferral, StatCan WDS, UN SDG, WHO GHO.
- Organizer clarification (reported by Amitoj, overrides the "cannot be fully vibecoded" note above): Claude can write all the code, but the team must understand it and be able to explain how it works.
- Code style for this project: simple enough for the team to explain, but still solid enough to score well on Technical Execution. Short files, plain names, no clever tricks. Every step ends with a short plain-English explanation of how the new code works.
- Hardware on hand: one Arduino Uno and a USB-C cable only. No kit, sensors, wires or buttons.
- Amitoj's decision: no money and no crypto in the product. Target Prompt 1. Leading idea: Vouch, where friends confirm health goals that sensors can't measure, with accessibility at its core. Not final until the team confirms.
- Team decision (replaces the "leading idea" note above): build Show Up (placeholder name), which pairs anonymous strangers on health goals, with no free chat and a new-match offer after 2 silent days. See SPEC.md. The legacy Fitbit Web API is switched off, so Fitbit or Google Health can only ever be an optional extra. Gemini model: gemini-3.5-flash-lite.
- Team split (first version): Amitoj's partner builds the web frontend and the mobile app. Claude builds the backend, and has also built a working web frontend at Amitoj's request. The API contract is docs/FRONTEND.md, so keep it up to date with any API change. The app has a mascot whose anger is decided in lib/rules.ts.
- The mascot is now the team's customizable pixel character (from avatar.py, ported exactly to lib/avatar.ts, checked at 497/497 images pixel-identical). Partners see each other's characters. Amitoj rejected the "Someone is waiting on you" headline, so don't use it. Teammates may also have a separate app, so check before reworking the frontend further. The AI disclosure must cover the character code, if AI helped make it.
- Amitoj's decisions (Sat 12:05 PM): real accounts with email sign-up, like Instagram, replacing the "no logins" approach; rule 5 says use Auth0. Partners stay anonymous to each other unless Amitoj decides otherwise. The frontend should be replaced by a friend's app once its code arrives, and the backend stays. Design polish comes later. The mascot was made by a teammate using a drag-and-drop tool, according to Amitoj.
- Sat 1:25 PM: the app is now Promise Pals, merging a friend's clickable mockup (design, flow and avatar menu, with fake login) with the real backend. Email and password sign-up uses the form in the app, sent to Auth0 from the server, and neither is stored by us. Auth0 needs its Password grant turned on. The mockup file contains Claude's own visual-widget styling, so AI disclosure must be settled with the friend. Design polish comes later.
- Organizer clarification (reported by Amitoj, Sat afternoon): the project can be a mockup, and real users aren't required. Rubric still scores working prototype under Technical Execution. Never present sample data or a fake login as real: label it.
