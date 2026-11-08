# Promise Pals: complete handoff

Written Saturday, Nov 7, 2026 at 3:30 PM (Calgary time) for the teammate taking over from Amitoj. Read this first, then `CLAUDE.md`.

If you're Claude: this file is the single source of truth for the event, the product, every decision so far, and what's left. Follow the working rules in `CLAUDE.md`, and check the time with `date` before each step.

---

## Newest changes (Sat evening)
- **THE focus (mentor feedback, Sat 8:30 PM): finding a partner without friction.** The Nearby board (lib/nearby.ts) replaced blind "Looking..." for real accounts: you see people near you who are looking now (first name, photo, community, distance between community centres, goal, why), tap "Ask to team up", they see it within 3 seconds and tap "Team up" or "Not now". "Invite someone you know" makes a link (`/?invite=CODE`) that pairs the new person with you as soon as they make their promise. Automatic matching (lib/matching.ts) now only applies to people without a profile. Tables: `team_requests`, `users.invite_code`.
- **iPhone steps** via an Apple Shortcut posting to a private link (lib/phone.ts, `/api/phone-steps`). +10 points (Fitbit +20).
- **Fitbit works for real.** Amitoj's Fitbit Air is connected through Google Health (project 817, Google Health API enabled, Amitoj added as a test user). On check-in we save today's steps (`checkins.fitbit_steps`) and today's workouts in words, like "Strength training 13 min" (`checkins.fitbit_workout`, from the `exercise` data type, filtered with `exercise.interval.civil_start_time`). So goals like "bench press every day" get Fitbit proof too. Verified against real data: 6,816 steps; Walk, Strength training, Racket sports.
- **Points** (`POINTS`, `checkinPoints` in lib/rules.ts): check in +10, partner confirms +5, Fitbit proof +20, honest rough day +5. Points unlock character extras: Headphones 30, Scarf 60, Cap 100 (`EXTRA_UNLOCKS`). The server refuses locked extras (`requireUnlocked` in lib/state.ts).
- **Privacy page** at /privacy and **Delete my account and data** on the Me tab (`POST /api/account/delete`). The Auth0 login itself isn't deleted yet.
- **Fitbit access list:** people request access in the app; the team copies emails at /admin (needs ADMIN_KEY) into Google's Test users.

## 0. Latest change (Sat 3:45 PM): real people, real Calgary, real proof

Amitoj decided the app should **not be anonymous**. It's now built around real, local people:
- **Profile:** first name, an optional photo, Calgary community (from City of Calgary open data) and an 18+ confirmation. You can't make a promise until it's done.
- **Why it matters:** an optional line on the promise. Gemini checks it, and it's left out if Gemini is down.
- **Matching:** someone in the same part of Calgary first (NW, NE, SW, SE, and so on), then same goal type.
- **Proof:** "Check in with a photo". Gemini screens every photo and describes it. Your partner taps "Confirm" for photo check-ins, and you can still check in without a photo.
- **Meet up:** a real public community centre or library about halfway between partners, from City of Calgary data (`lib/calgary.json`, refreshed by `npm run calgary:fetch`).
- **Privacy:** photos are only ever sent to their owner and current partner, through `/api/photo`.
- **Gemini backup:** if `gemini-3.5-flash-lite` is busy, which happened often on Saturday afternoon, the app retries on `gemini-3.1-flash-lite`.
- **Tests:** 97 end-to-end checks and the browser test pass.

**These override the older "anonymous" notes below**, in sections 3 and 4.

## Pitch decisions (Sat 6:45 PM)
- **Who it's for:** Calgarians who struggle to stick to their health goals. Physio clinics and campus wellness programs pay, through clinic codes (physio at home is the lead example).
- **One sentence:** "Promise Pals pairs Calgarians who struggle to stick to their health goals with a nearby partner, and proves every check-in with a photo or their Fitbit."
- **Accessibility headline:** "Built for people step counters leave out." Any goal counts, rough days are allowed, proof is optional, it works with screen readers, and it has big plain text and reduced motion.
- **The physical piece:** a Fitbit Air, with steps as automatic proof.

## 1. Status in 30 seconds

- **Live site:** https://hackathon-gilt-iota.vercel.app (demo: `/?demo=1`, clinic staff screen: `/clinic`)
- **Code:** https://github.com/amitoj7177/show-up (public). The folder on Amitoj's laptop is `~/Desktop/hackathon`.
- **Working end to end on real services:** sign-up and log-in (Auth0), safety check (Gemini), database (Tiger Data), matching, daily check-ins, streaks, moods, messages, clinic groups, progress screen, and the public landing page.
- **Tests:** 28 rule tests and 76 end-to-end checks pass. A two-person browser test and an automated accessibility audit (axe) pass with no issues.
- **Harsh self-grade against the rubric:** about **17/25** today, and 20-22 is realistic. See section 9.
- **Biggest remaining work:** not code. The README with the AI disclosure, the Devpost page, the 2-5 minute video, the pitch, and Q&A practice. See section 10.

---

## 2. The event

**Hack the Change YYC 2026**, run by Code the Change YYC (MLH-supported) at the University of Calgary, ICT 102/114. In person.

### Key times (Calgary time)
| When | What |
|---|---|
| Sat Nov 7, 9:00 AM | Started |
| Sat 3:00 and 3:30 PM | MLH workshops |
| Sat 6:00 PM | Dinner |
| Sun Nov 8, 9:00 AM | Breakfast |
| **Sun 11:30 AM** | **Submissions close on Devpost. Late or incomplete means rejected.** |
| Sun 12:30 PM | Prescreens complete |
| Sun 12:45-4:00 PM | Judging. Round 1 is back-to-back live judging in the ENG Lounge, then final judging |
| Sun 4:45 PM | Winners and closing ceremony |

**Team plan:** first submission by 9:30 AM, final by 11:00 AM. Don't leave it to 11:29.

### Official prompt (we chose Prompt 1)
> **Prompt 1:** "How can we leverage technology to promote health, social connection, and well-being in our communities?"
>
> Prompt 2 (not ours): "How can we leverage technology to help people develop in-demand skills and build meaningful networks in a rapidly changing job market?"
>
> "Participants are encouraged to think creatively and develop solutions that address at least one of these critical issues."

### Official rubric (word for word)
- **Innovation & Creativity:** Is the idea original or a fresh take on existing solutions? Does it creatively apply technology to urban challenges (e.g., housing, mobility, disaster resilience, inclusivity)?
- **Impact & Relevance to Prompt:** Does the solution clearly address the challenge? Could it meaningfully improve lives?
- **Feasibility & Scalability:** Is the solution practical given real constraints (budget, infrastructure, etc.)? Could it scale beyond a demo into a real city/community setting?
- **Technical Execution:** Quality of the implementation (working prototype, technical depth, stability)? Use of appropriate technology stack. Is the solution technically sound and well-built?
- **User Experience & Design:** Is the solution intuitive, accessible and user-friendly? Is the solution aesthetically pleasing? Does the design of the product elevate its function and original idea?

### Rules that matter
- **Built during the event:** all design, code and hardware must be created during the hackathon. Third-party tools and frameworks are allowed.
- **AI:** "AI tools are allowed, but projects must demonstrate original work. Fully 'vibe-coded' projects may not pass prescreening." **Organizers told Amitoj:** Claude can write the code, but **the team must understand it and be able to explain how it works.** AI use **must be disclosed**. Not disclosing can mean disqualification.
- **Mockups:** organizers told Amitoj the project **can be a mockup, and real users aren't required.** The rubric still rewards a working prototype, and ours works.
- **Team size:** 2-5.
- **Devpost title format:** `TEAM ID - TEAM NAME - PROJECT NAME`
- **The submission must have:** a 2-5 minute video, a GitHub link, and a "Satisfactory" score on every rubric criterion. It must "appear complete" to pass prescreening.
- **Presentation:** 3 minutes plus 2 minutes of Q&A, with a hard cutoff. All team members present.

### Prizes
| Prize | Amount | Our honest chance |
|---|---|---|
| 1st / 2nd / 3rd | $5,000 / $3,000 / $2,000, half of each donated to charity | Main target |
| **Clio**: Best in Accessibility (accessibility, inclusivity, user trust, privacy, transparency, responsible design) | $100 | **Good:** "Why?" panel, privacy design, no free chat, gentle mode, accessibility audit |
| **Benevity**: Best Local Impact (real Calgary challenges, lasting change) | $100 + $100 to charity | **Medium:** the clinic version is "Calgary first", but there's no real partner yet |
| **Voltex**: Best Use of Real-World Energy Data (must use real data like AESO) | $500 | **No.** The app has no energy data, and forcing it in would look fake |
| MLH: Gemini API, Auth0, Tiger Data | swag, headphones, Stream Deck Mini | **Yes, all three are used for real.** Opt in on Devpost |
| MLH: GoDaddy Registry (best domain) | gift card | Only if someone registers a domain |
| MLH: Vultr, Solana, Entire | | Not used, so don't claim them |

### Judges (from the event website)
Energy Toolbase (×3), CNRL, RBC (×2), Bridgewater Bank (×3), Morgan Stanley (×2), AMA, MRO, Deltek, Calgary Airports (×3), TELUS (×2), ZeroKey, Benevity, Clio, University of Calgary. Expect questions on **who pays, cost to run, how it rolls out, privacy and safety**, and whether the team can explain the code.

---

## 3. The product: Promise Pals

**One line:** make a health promise, get paired with one anonymous partner on a similar goal, and check in once a day. Your pixel character cheers you on, and gets grumpy if you go quiet.

**The problem:** people drop health goals like physio exercises because nobody notices when they stop. Friends are busy, and step counters ignore goals like stretching or getting outside.

**Who it's for:**
- **Anyone** working on a health goal alone.
- **Clinic version:** a Calgary physio clinic or campus wellness program gives its people a join code. They're paired within that group, and staff see **only anonymous totals**. That answers "who pays" (the clinic) and "where do users come from" (the clinic brings them).

### How accountability works (all in `lib/rules.ts`)
| Situation | What happens |
|---|---|
| Both partners check in | Shared streak +1 |
| "Skip today" (stored as `rough`) | Streak stays safe, your character looks **sad, never angry**, with a kind line |
| Silence after your check-in time | Character gets **annoyed**, then **mad** after 2 hours or a missed day, then **furious** after 2+ silent days |
| The day you join | No anger, even if the check-in time has passed |
| Partner silent for 2 full days | You're offered a new partner |
| After 7 days | Weekly summary and confetti, and you can stay or get a new partner |
| Gentle mode | Your character never gets angry |
| Your partner sees you | Only calm, happy or caring. **Never your anger or sadness.** Nobody gets shamed in front of a stranger |

### Signs a real person is on the other end
- "Active now" or "Last active 2 hours ago", from when they last opened the app.
- Their real check-in time: "Kind Fox checked in at 7:42 AM".
- Seen receipts: "✓✓ Seen by Kind Fox at 8:03 AM" under your check-in.

### Safety and privacy (strong for the Clio judge)
- **No free chat:** partners can only send 8 pre-written messages, one per day.
- **Anonymous:** made-up nickname plus pixel character. **Auth0 keeps email and password, and we store neither.**
- **Goal check:** Gemini checks every goal before a stranger sees it. It refuses weight or body goals, dangerous goals, contact details and meet-ups. It removes names and addresses, so the partner only sees the cleaned version.
- **"Why?" panel:** shows exactly what was checked, the result, what the partner sees, who checked it and when.
- **Crisis safety:** if a goal suggests self-harm, the app refuses it and shows 988 and Health Link 811. **This is the only place support links now appear.** Amitoj asked to remove the general "Need support?" footer, but this case was deliberately kept.
- **Leave or report** in one tap. Reported people are never paired again.
- **Clinic staff** see totals only, and only once 5 people have joined.

### Screens
1. **Landing page** (logged out, full width): hero, three sourced stats, how it works, character moods, for clinics, privacy, and a call to action. Pixel style.
2. **Sign up / Log in / Forgot password:** the team's mockup design. Passwords must be **15+ characters**, which is the Auth0 tenant's rule.
3. **Avatar:** the team's arrow-based customization menu (hair, colours, skin, eyes, outfit, extras, shuffle).
4. **Done** and **Make a promise:** goal, goal type, check-in time, optional clinic code.
5. **Finding a partner** (with a "?" box), then **Partner found!** with both characters sliding in.
6. **Today tab:** your character and your partner's, a speech bubble, presence, a big CHECK IN, "Skip today", seen receipts, the partner's status, messages, the week grid and the "Why?" panel. Tap your character for a pep talk.
7. **Partner tab:** send one of the 8 messages, new-match offer, leave or report.
8. **Progress tab:** the team's home screen design: streak, best and % done, progress bar, calendar with "Replay my days", 6 badges, partner card, "New promise".
9. **Avatar tab:** customize, mood preview, gentle mode, log out.
10. **/clinic:** staff enter their staff key and see anonymous totals. `/clinic?demo=1` shows **labelled sample numbers**, and whether to keep that page is still undecided.
11. **/results:** live real-use counts, excluding demo data.
12. **`/?demo=1`:** the full app with labelled sample data, mood buttons and sample progress. It works with no internet and no sign-in.

### Where the design came from
- **Pixel character, customization menu, login flow and Promise Pals name:** from the teammate's mockups. These were `message.txt` (avatar.py), `pixel_app_login_flow_mockup.html`, `Partner found, pep talk and sad moments.html` and `home-screen.html`, all in Amitoj's Downloads.
- **The character in `lib/avatar.ts`** is a TypeScript port of `avatar.py`, **checked pixel-identical on 497 test images**.
- **One change from the team's design:** the Today background follows **your** mood, while the mockup used your partner's. Your anger is the accountability, so this was on purpose. It's a one-line change if the team prefers theirs.

---

## 4. Decisions Amitoj made (don't undo these without asking)

1. Prompt 1. The idea evolved from "Show Up" to stranger pairing to Promise Pals.
2. **No money or crypto** in the product.
3. **Strangers, not friends:** no free chat, new match after 2 silent days. **Updated: not anonymous any more.** First names, optional photos and Calgary communities. See section 0.
4. A **mascot that gets mad** when you don't check in, using the team's customizable pixel character.
5. **Real accounts with email**, like Instagram, through Auth0, with the sign-up form inside the app.
6. **Use the friends' app and design** over Claude's earlier versions.
7. **Clinic version:** yes. **No made-up clinics:** "Demo Physio Clinic" was deleted from the database and the demo. Only add a real clinic or group with that organization's actual agreement.
8. **Remove the "Need support right now?" footer** everywhere, except crisis links on a flagged goal.
9. Wants it to look **fully polished, not vibe-coded**, "like Clio's website" in quality, but don't copy Clio's design. Design polish was explicitly saved for later.
10. **Voltex/energy:** don't pivot. A "cheapest energy hour for students" idea was rejected because most Albertans pay a fixed rate. See section 11.
11. Organizers allow a mockup and don't require real users. **Never present sample data as real.**

### Open decisions (ask Amitoj or the team)
- ~~More "feels real" features~~: **done**. Amitoj chose first name, photo and why it matters, photo proof with partner confirmation, and same-area matching with meet-up spots.
- **Keep or remove `/clinic?demo=1`**, the labelled sample numbers page.
- **A real group:** for example, a group for Hack the Change hackers, which needs the team to be comfortable using the event's name. Or a real Calgary clinic or UCalgary office that actually agrees.
- **The AI disclosure:** what exactly the teammates used for the mockups. See section 8.

---

## 5. How the code works

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, on Vercel. One repo and one app. Database: Tiger Data (Postgres), using `pg`. Accounts: Auth0. AI: Google Gemini (`gemini-3.5-flash-lite`) via `@google/genai`. No charts library.

**Next.js 16 gotchas:**
- Middleware is now called **proxy**, and lives in `proxy.ts`, which adds CORS headers for `/api/*`.
- `cacheComponents` was removed from `next.config.ts` because it broke the live API.
- Read `node_modules/next/dist/docs/` before using new Next features. See `AGENTS.md`.

### File map
| File | What it does |
|---|---|
| `lib/rules.ts` | **All the accountability rules**: streak, silence, moods, messages, pep talk lines (`TALK`), badges, password rule, history and stats. Pure functions with no database. **Know this file for Q&A.** |
| `lib/rules.test.ts` | 28 tests for the rules (`npm test`) |
| `lib/avatar.ts` | The pixel character, ported exactly from `avatar.py`, plus the customize options |
| `lib/state.ts` | Builds the whole `/api/today` response: partner, streak, mood, presence, seen receipts |
| `lib/matching.ts` | Pairs waiting people: same clinic only, same goal type first, any type after 30s, never the same partner twice |
| `lib/auth.ts` | Login sessions: random token, stored only as a hash |
| `lib/auth0.ts` | Talks to Auth0 from the server: sign-up, password check, reset email |
| `lib/gemini.ts` | The goal safety check, with a fallback rule that works if Gemini is down |
| `lib/groups.ts` | Clinic groups and anonymous totals, with a minimum of 5 people |
| `lib/demo.ts` | Labelled sample data for `?demo=1` |
| `lib/db.ts`, `lib/http.ts`, `lib/api.ts`, `lib/types.ts`, `lib/sources.ts` | Database helper, friendly errors, front-end API helper, shapes, list of services used |
| `app/api/*/route.ts` | One file per endpoint. See `docs/FRONTEND.md` for the full API |
| `components/App.tsx` | Decides which screen shows. Refreshes `/api/today` every 3 seconds once logged in |
| `components/Landing.tsx` | Public website |
| `components/PromiseScreen.tsx` | Sign-up, log-in, avatar, done, make a promise |
| `components/Moments.tsx` | Finding and Partner found screens, plus time and presence helpers |
| `components/TodayScreen.tsx`, `PartnerScreen.tsx`, `ProgressScreen.tsx`, `MascotScreen.tsx` | The four tabs |
| `components/Customizer.tsx`, `PixelAvatar.tsx`, `PixelScene.tsx`, `Shared.tsx` | Avatar menu, character drawing, waving park scene, shared styles and buttons |
| `app/clinic/page.tsx`, `app/results/page.tsx` | Staff dashboard, live results |
| `db/schema.sql` | Every table: `users` (one per promise), `pairs`, `checkins`, `encouragements`, `reports`, `groups`, `accounts`, `sessions`. Safe to run again |
| `scripts/setup-db.mjs` | Creates or updates tables (`npm run db:setup`) |
| `scripts/create-group.mjs` | Creates a real clinic group (`npm run group:create -- "Name"`). Prints the join code and staff key **once** |
| `scripts/smoke-test.mjs` | 76 end-to-end checks against a running app (`npm run smoke`) |
| `scripts/test-db.mjs` | Throwaway in-memory Postgres for testing (`npm run test:db`) |
| `docs/FRONTEND.md` | Full API contract for anyone building screens or a mobile app |
| `SPEC.md` | Original spec. Partly out of date: it was written before Promise Pals, accounts and clinics. This file wins where they disagree |

### Environment variables (`.env.local`, never committed)
| Variable | Where it comes from |
|---|---|
| `DATABASE_URL` | Tiger Data service URL. **Must end with `?uselibpqcompat=true&sslmode=require` and be in quotes**, because Tiger uses its own certificate |
| `GEMINI_API_KEY` | Google AI Studio |
| `AUTH0_DOMAIN` | `dev-qu45hfasa2ziu14h.ca.auth0.com` |
| `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET` | Auth0 app **"Promise Pals"** (Regular Web App, Password grant on) |
| `GEMINI_MODEL`, `DB_POOL_MAX` | Optional |

**Ask Amitoj to send `.env.local` privately.** Never paste it into the repo, a doc or a public channel. All five are also set in Vercel → project `hackathon` → Settings → Environment Variables (Production).

### Accounts and services
- **Vercel:** team `super-singhs`, project `hackathon`. Amitoj is logged in on his laptop. To deploy from another machine, he must invite you to the Vercel team.
- **GitHub:** `amitoj7177/show-up`. Ask to be added as a collaborator to push.
- **Auth0 tenant** `dev-qu45hfasa2ziu14h` (Canada region). Two apps: **"Promise Pals"** (used by the site) and "promise pals" (an admin, machine-to-machine app Amitoj made). **Delete the admin app after the event.**
- **Tiger Data** service `promise-pals`.
- **Gemini** key from Amitoj's Google AI Studio.

---

## 6. How to run, test and deploy

```bash
npm install
npm test                     # 28 rule tests, no setup needed

# Full end-to-end test, without touching the real database:
npm run test:db              # terminal 1: leave running
# terminal 2:
export DATABASE_URL="postgres://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable"
node scripts/setup-db.mjs
node scripts/create-group.mjs "Test Clinic"   # copy the code and key it prints
export GROUP_CODE=... STAFF_KEY=...
npm run build && DB_POOL_MAX=1 npx next start -p 3100   # Next reads Auth0 and Gemini from .env.local
# terminal 3:
BASE_URL=http://localhost:3100 GROUP_CODE=... STAFF_KEY=... npm run smoke   # expect 76 passed

npm run dev                  # everyday local development, using .env.local (the REAL database)
npx vercel deploy --prod --yes   # deploy. Wait about 10 seconds, then check the live site
```

**Testing gotchas, learned the hard way:**
- **Never run `npm run smoke` against the real database**, because it creates fake users that would show up in the results.
- **The smoke test creates real Auth0 accounts** ending in `@example.com`. Delete them afterwards in the Auth0 dashboard → User Management → Users.
- **Restart `npm run test:db` between runs.** Leftover waiting users get paired with new test users and cause false failures.
- **Matching waits 30 seconds** for someone with the same goal type, and Gemini picks the type. Tests that need instant pairing must use goals of the same type, like two physio goals.
- **After deploying**, the live site can show the old version for a few seconds.
- **On UCalgary WiFi**, `*.tmp.now` temporary Vercel links fail with a Fortinet certificate error. The real `vercel.app` address works.

---

## 7. Sourced stats for the pitch (checked)

| Claim | Source | Careful |
|---|---|---|
| Support helps people stick with it: recruited with friends, 95% finished and 66% kept results, vs 76% and 24% alone | [Wing & Jeffery, 1999](https://experts.umn.edu/en/publications/benefits-of-recruiting-participants-with-friends-and-increasing-s/) | Weight-loss study with **friends, not strangers**, and the app bans weight goals |
| Tracking progress helps, more when it's reported or public (138 trials) | [Harkin et al., 2016](https://eprints.whiterose.ac.uk/id/eprint/91437/) | **The best fit for our daily check-in** |
| Strong social ties mean a 50% greater likelihood of survival (148 studies) | [Holt-Lunstad et al., 2010](https://doaj.org/article/c9833ba608474b048444b92ae7ee48ad) | Odds ratio. Don't say "live 50% longer" |
| Up to 50% don't keep up home exercise programs | [JMIR, 2018](https://mhealth.jmir.org/2018/3/e47/PDF) | Upper estimate |
| 2 in 10 Calgarians feel lonely often or always, vs 13.4% of Canadians | [Calgary Journal](https://calgaryjournal.ca/2025/04/07/tackling-loneliness-in-calgarys-older-adults/), [Avenue](https://www.avenuecalgary.com/city-life/loneliness-calgary/) | Secondhand reports. **Find the original Calgary Foundation and StatCan reports before using** |

**Never use "95% with an accountability partner (ASTD)".** It's unverified internet lore.

**The honest gap:** there's no solid study showing strangers work as accountability partners. Say "we're testing this".

---

## 8. AI usage disclosure (draft, finish it)

**Must go in both the README and Devpost.** Be accurate:

- **Development:** the code was written with Claude Code (Anthropic) during the event, directed, reviewed and tested by the team. The team must be able to explain every part.
- **Design:** the Promise Pals character, customization menu and screen mockups were made by teammates during the event. **To confirm:** Amitoj says the mascot was made with a drag-and-drop tool. But the mockup files contain Claude's own styling code (`anthropic-sans`, `vis-container`), and `message.txt` reads like an AI chat reply. **Ask the teammates exactly which tools they used**, and disclose them.
- **In the app:** Google Gemini checks each goal before a partner sees it, refusing unsafe goals and removing personal details. It only sees the goal text, and it never writes messages, gives advice or decides matches or streaks.
- **What the team did:** the idea and its changes, product decisions, character art direction, mockups, testing, and the pitch.

---

## 9. Harsh self-grade (Claude's judgment, scored on what exists)

| Criterion | Now | What gets it higher |
|---|---|---|
| Innovation | 3.5 | Lean on what's distinctive: a character that's sad (not mad) when you skip, anger your partner never sees, seen receipts, the clinic model |
| Impact & prompt | 3.5 | One real quote from a physio or wellness worker. Use the sourced stats. "In our communities" is the weakest part, so pitch Calgary clinics |
| Feasibility | 3 | Clear "who pays": clinics pay per program. Explain cost to run (Vercel, Tiger and Auth0 free tiers) and a report-review plan |
| Technical | 3.5 | Stable live demo on two phones, and the team can explain `lib/rules.ts` and matching |
| UX & design | 3.5 | The design polish pass, a phone test with VoiceOver, and consistent spacing |

---

## 10. What's left, in order

**Saturday evening (before about 10 PM):**
1. Settle the open decisions in section 4, and build A/B if wanted (about 45 minutes).
2. Get one real quote from a Calgary physio or UCalgary wellness person, with permission to use it.
3. **Two-phone test** on the live site with real emails.
4. **Design polish pass**, which Amitoj saved for later. Check spacing, sizes and consistency on a phone and a laptop.

**Saturday night (10 PM - 3 AM):**
5. **Accessibility pass:** VoiceOver on an iPhone and a Mac. Pixel-font buttons are 14-15px, under the 18px rule, so decide whether to enlarge them.
6. Bug fixes only after 1 AM. **3 AM: feature freeze.**

**Sunday early (3-7 AM):**
7. **README.md:** problem, who uses it, 3 bullets on what it does, screenshots, sources (from `lib/sources.ts`), accessibility and privacy, tech stack, how to run, what's next and who pays, team, and **the AI Usage Disclosure** (section 8).
8. **Devpost write-up:** Inspiration, What it does, How we built it, AI disclosure, Challenges, Accomplishments, What we learned, What's next. Honest, with no overclaiming.
9. **2-5 minute video**, public or unlisted, that opens in an incognito window.

**Sunday 7-9:30 AM:**
10. **Pitch practice** (3 min plus 2 min Q&A, everyone presents) and Q&A prep, including "why this isn't a habit app", "who pays", "how do strangers stay safe", "what does Gemini do exactly" and "explain this code".
11. **Submission checklist:**
    - [ ] Title: `Team ID - Team Name - Promise Pals`
    - [ ] Description filled in, all team members added
    - [ ] 2-5 min video, public or unlisted, opens in incognito
    - [ ] GitHub repo public, opens in incognito
    - [ ] Live URL works in incognito on a phone
    - [ ] AI usage disclosed in the README **and** on Devpost
    - [ ] Opted in to Clio, Benevity, Gemini, Auth0 and Tiger Data. Not Voltex
    - [ ] First submission by 9:30 AM, final by 11:00 AM

**After the event:**
- Rotate or delete the Gemini key, the Tiger password and the Auth0 client secret, since they appeared in a chat.
- Delete the Auth0 admin app "promise pals".
- Tighten the database TLS: use Tiger's CA certificate instead of `uselibpqcompat`.

---

## 11. Things already tried or rejected (don't redo)

- **Fitbit:** the legacy Fitbit Web API was shut down (Oct 30 / Nov 2, 2026), and its replacement may not accept new projects.
- **Energy idea for Voltex:** Alberta's default Rate of Last Resort is fixed at about 12¢/kWh through 2026, so "use power at the cheapest hour" doesn't save most students money.
- **Solana staking:** already done by others (Moonwalk, Become, Ascend), and Amitoj said no money.
- **Copying Clio's website design:** no. Clio is a sponsor and judge, and the rules require original work.
- **Kettle mascot and the "Show Up" name:** replaced by the team's character and Promise Pals.
- **The headline "Someone is waiting on you":** Amitoj disliked it.
- **Earlier idea list:** ColdSnap, Daybreak, HeatWatch, Headcount, KitCheck, BenchPass, FirstCall, CareRoute, NextShift, SafeStep, Common Table and BillBridge were all considered and dropped.

---

## 12. How Amitoj likes to work

- Plain English and short answers. Small steps, each ending with what changed, how to test it, and the git commit command.
- He wants to **win** and to understand the project, but **not to fake it**: real data, honest labels, accurate AI disclosure.
- He reacts strongly to things that feel generic, AI-generated or unpolished. Show screenshots and test on a real phone.
- **Ask before** pushing to GitHub, deleting things, or adding real organization names.
