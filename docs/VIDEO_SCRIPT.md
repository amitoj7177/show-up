# Promise Pals: demo video script

**Length:** about 4 minutes 30 seconds. Devpost allows 2 to 5 minutes, so you have a little room.
**Read at a calm pace.** Each part has a time budget. Words in **bold** are what you say. Lines starting with 🎬 are what's on screen.

**Before you record:**
- Use a phone screen recording (iPhone: Control Centre → Record) or the laptop with the phone frame.
- Log in on two phones as two different accounts, both on the Nearby board (no partner yet). If you can't get two phones, use **See a demo** for Part 2. It does the same flow with labelled sample people.
- Your Fitbit Air is connected and synced (open the Fitbit app once right before).
- Turn **Do Not Disturb** on.

---

## Part 1. The problem (0:00 to 0:30)

🎬 The landing page, the two characters walking in and saying "Team up!"

**"Hi, we're [team name], and this is Promise Pals.**

**Lots of Calgarians want to stick to a health goal: their physio exercises, a daily walk, getting outside. But most people give up. Up to half of people don't keep up their home exercises.**

**What helps is another person. Research across 148 studies shows strong social ties make a real difference to health. But finding someone is hard. People are out there looking, and there's no easy way to find each other.**

**Promise Pals fixes that. You find a health partner near you in under a minute, you check in every day, and you prove it."**

---

## Part 2. Finding a partner (0:30 to 1:20)

🎬 Tap **Get started**. Show sign-up quickly: email and password, then the profile.

**"You sign up with an email and a password. Then a short profile: your first name, a photo if you want, and your Calgary community. The list of communities is real City of Calgary open data."**

🎬 Point at **How do you move?** on the profile. Pick an option.

**"This question is optional. If you use a wheelchair, a walker, or live with chronic pain, you can say so, and you'll see people who move like you first."**

🎬 Type a promise. Tap **Find my partner**.

**"Then you make a promise. Any health goal counts."**

🎬 The **Nearby board**. Point at a card: name, community, distance, goal.

**"This is the Nearby board. These are real people near you who are looking right now. You see their first name, their community, how far away they are, and what they're working on. Never their exact address."**

🎬 Tap **Ask [name] to team up**. Show the second phone: **"[name] wants to team up"** pops up. Tap **Team up**. Both phones show **"You're a team!"**

**"I ask someone to team up. Their phone gets the request within three seconds. They say yes, and we're a team. No awkward chat, no waiting in the dark."**

**"If nobody's right for you, you can invite someone you know with a link, and you're paired the moment they join. And if nobody's around yet, a clearly labelled practice partner steps in after 30 seconds, so you're never stuck waiting."**

---

## Part 3. Checking in, with real proof (1:20 to 2:15)

🎬 The **Today** screen: both characters side by side.

**"Every day, you check in. There are two ways, and both are real proof."**

🎬 Tap **Check in with a photo**. Take a photo of your exercise mat or shoes.

**"One: a photo of what you did. Before my partner sees it, AI checks that it's safe and describes it, and my partner can confirm it."**

🎬 On the second phone, show the partner's proof and tap **Confirm**.

🎬 Then show **Check in with Fitbit** on your phone, and the proof that appears: steps, workouts, active minutes.

**"Two: my Fitbit. Promise Pals reads my real Fitbit data through Google's Health API. Today it found my steps, and the workouts my Fitbit spotted on its own, like strength training. And it reads active minutes from heart rate, so a wheelchair workout or seated exercises count just as much as a walk. You can't fake a Fitbit check-in: if your Fitbit shows nothing today, it says so."**

🎬 Tap your character for a pep talk. Then go to **Progress**: streak, badges.

**"Your character cheers you on. Keep it up and you earn badges and points that unlock new things for your character."**

---

## Part 4. Accountability (2:15 to 2:45)

🎬 Use **See a demo** → **Skip to the Today screen** → the **Demo: jump to a mood** buttons. Tap **Annoyed**, **Mad**, **Furious**, then **Sad**.

**"If you let your partner down, your character notices. Late, it taps its foot. Miss a day, it gets mad. Go quiet for days, it's furious.**

**But rough days happen. If you tell your partner you're skipping, your streak stays safe and your character is just a bit sad, never angry. There's a gentle mode that turns the anger off completely. And if a partner goes quiet for two days, you can get a new one, so nobody is stuck."**

---

## Part 5. Accessibility (2:45 to 3:30)

🎬 Back on the landing page, scroll to **Accessible by design**. Flip **Bigger text**, **Stronger contrast** and **Less motion** on, live.

**"We built Promise Pals for the people step counters leave out.**

**You can tell us how you move, and find someone who moves like you. Fitbit proof comes from heart rate, not only steps.**

**These easy reading switches change the whole app instantly: bigger text, stronger contrast, and less motion. If your phone is already set to reduce motion, every animation stops by itself.**

**It works with screen readers. Every button has a real label, every character's mood is described in words, and nothing relies on colour alone. It works with just a keyboard, all body text is at least 18 pixels, and colours meet the WCAG AA contrast standard. We test every screen with automated accessibility checks, and every screen passes with zero issues."**

---

## Part 6. Trust and privacy (3:30 to 3:55)

🎬 Open **/privacy** (link at the bottom of the landing page), then show **Me → Delete my account and data**.

**"Your partner is a real person, so safety matters. Partners only see your first name, photo and community. There's no free chat, only kind pre-written messages, and you can report or leave in one tap. Every goal and photo is checked by AI first, and a Why panel shows exactly how the AI decided. You must be 18 or older. Our privacy page says in plain words what we keep and who sees it, and you can delete everything at any time."**

---

## Part 7. How it's built (3:55 to 4:25)

🎬 Show the GitHub repo, or the code in your editor, scrolling slowly.

**"Under the hood: it's a Next.js web app written in TypeScript, hosted on Vercel, so it works on any phone with no download.**

**Logins use Auth0, so we never store a password. Data lives in a Postgres database on Tiger Data. Fitbit data comes from Google's Health API. Calgary communities come from the City of Calgary's open data. And Google Gemini checks goals and photos.**

**We wrote the code with Claude Code, an AI coding tool. Our team designed the product, made every decision, drew the characters, and tested it. We have 120 automated server checks and accessibility tests that run on every change."**

---

## Part 8. Close (4:25 to 4:40)

🎬 Both phones side by side on Today. Or the landing page hero.

**"Promise Pals: find a health partner near you, and keep each other going. Thanks for watching."**

---
---

# Cheat sheet: how the code works

**Use this for Q&A, or to explain the code yourself.** Each answer follows the pattern "we used X to do Y". File names are in `code style`, so you can open them and point.

## The big picture
- **"What is it built with?"**
  - **Next.js 16** with **React 19** and **TypeScript**, a framework for making websites that act like apps. One project holds both the screens and the server.
  - **Tailwind CSS** for styling.
  - **Vercel** hosts it. We deploy with one command: `npx vercel deploy --prod`.
- **"Why a website and not an app?"** Anyone can open it on any phone in seconds, and it can be added to the home screen like an app. A native app comes next, mainly to read Apple Health.
- **How the screens stay live:** every phone asks the server "what's new?" every 3 seconds (`REFRESH_EVERY_MS = 3000` in `components/App.tsx`). That's how a team-up request or a check-in shows up on your partner's phone almost instantly.

## Where the code lives
- `app/` holds the pages and the server routes. Every server action is a file like `app/api/checkin/route.ts`, so keys and secrets stay on the server and never reach the phone.
- `components/` holds the screens: the landing page, Today, the Nearby board, Progress and Me.
- `lib/` holds the logic:
  - `lib/rules.ts`: every rule in one place (streaks, the mascot's moods, points, badges).
  - `lib/nearby.ts`: the Nearby board.
  - `lib/fitbit.ts`: reading Fitbit data.
  - `lib/moderation.ts` and `lib/gemini.ts`: the AI checks.
- `db/schema.sql` lists every database table.

## Accounts and logins
- **"How do logins work?"** We used **Auth0**. When you sign up, our server passes your email and password straight to Auth0, and Auth0 checks them. **We never store your password, and we don't keep your email.**
- After you log in, the phone gets a random token. We store only a scrambled version of it, a **SHA-256 hash**, so even a stolen database copy can't be used to log in.

## The Nearby board (`lib/nearby.ts`)
- **"How do you find people near me?"** One database query finds everyone who is:
  - looking right now
  - seen in the last 3 days
  - not your old partner
  - not someone who already said "not now" to you
- **Distance:** we take the centre point of each Calgary community from the City's open data and measure between them. **We never know anyone's real location**, only their community.
- **Order:** people who move like you come first, then the closest, then the same kind of goal.
- **Asking and accepting:** "Ask to team up" saves a row in a `team_requests` table. Your partner's phone sees it on the next 3-second refresh. When they tap yes, we use a **database transaction that locks both people** (`FOR UPDATE`), so even if two people say yes at the same moment, nobody ends up with two partners.
- **Invite links:** each person gets a short random code. Whoever makes a promise through that link is paired with you straight away (`joinByInvite`).

## Check-ins and proof
- **Photos:** the phone shrinks the photo first (`shrinkPhoto` in `components/Photos.tsx` makes it a small JPEG), so it uploads fast on bad Wi-Fi. The server sends it to **Gemini**, which says whether it's safe and describes it in a few words. Only then can your partner see it. Photos are only ever shown to you and your partner.
- **Fitbit (`lib/fitbit.ts`):**
  - You connect once with Google's sign-in (**OAuth**). We keep a long-lived key, never your Google password.
  - When you check in with Fitbit, we ask **Google's Health API** for today's **steps**, **workouts** (the `exercise` data type) and **active zone minutes** (from heart rate). We add them up and save them as proof.
  - "Check in with Fitbit" is refused unless Fitbit shows real activity today, so it can't be faked.
- **Points (`checkinPoints` in `lib/rules.ts`):** check in +10, partner confirms +5, Fitbit proof +20, an honest rough day +5. Points unlock character extras, and the server checks you've earned them, so nobody can cheat by editing the app.

## The mascot (`mascotFor` in `lib/rules.ts`)
- **"How does it decide its mood?"** It's plain rules, no AI. It looks at:
  - whether you checked in today
  - how late you are past your check-in time
  - how many days you've gone quiet
- One quiet day makes it mad, two or more makes it furious. A rough day you told your partner about makes it sad, never angry. Gentle mode never gets angry at all.
- After **2 silent days** (`SILENT_DAYS_BEFORE_NEW_MATCH = 2`), the waiting partner can get someone new.
- The characters are drawn pixel by pixel in code (`lib/avatar.ts`), ported from our teammate's character design, so every outfit and mood is generated live, not saved as images.

## AI (Gemini): what it does and doesn't do
- **Models:** `gemini-3.5-flash-lite`, with `gemini-3.1-flash-lite` as a backup if the first is busy.
- **What it does:**
  - checks a **goal** (safe, not a weight-loss goal, and rewrites it in plain words for your partner, without personal details)
  - checks your **"why it matters"** line
  - checks **photos**
- **What it never does:** chat, give health advice, choose your partner, or decide your streak. Those are all plain rules we wrote.
- **Transparency:** every AI decision has a **"Why?" panel** showing what it checked and what it decided.
- **If Gemini is down:** goal checks still let you continue, and photos ask you to try again or use Fitbit. The app never breaks.

## Accessibility (how each one is built)
- **Real buttons and labels:** every tap target is a real `<button>` or link with a label. Icon buttons have `aria-label`s. Each character has a text description of its mood (`screenReaderText`).
- **Never colour alone:** the week grid uses ✓ ~ × symbols and hidden words as well as colours.
- **Big text and contrast:** body text is 18 pixels, and colours were checked against WCAG AA.
- **Easy reading switches (`lib/reading.ts`):** they set a tag on the page, like `data-text="large"`, and our CSS reacts to it. The choice is saved on the phone and applied **before the page draws**, so there's no flash of small text.
- **Less motion:** we respect the phone's own "reduce motion" setting, plus our own switch. Every animation checks `wantsLessMotion()`.
- **How we test it:** we run **axe-core**, the industry-standard accessibility checker, over every screen in an automated browser. It reports **0 issues**.

## Privacy and safety
- **Delete my account and data** (`app/api/account/delete/route.ts`) removes your profile, photos, goals, Fitbit link and login from our database. Your partner keeps empty check-in marks so their streak still adds up, with nothing about you in them.
- No meet-ups through the app, no free chat, 18+ only, and report or leave in one tap.

## Testing
- **120 server checks** (`scripts/smoke-test.mjs`): they sign up real test accounts, pair them through the board, check in, confirm, delete, and more, against a throwaway test database.
- **38 rule tests** (`lib/rules.test.ts`, run with `npm test`): streaks, moods, points, Fitbit parsing.
- **Browser tests with accessibility checks** on every screen.

## Likely judge questions
- **"Who pays?"** Calgary physio clinics and community programs. Their patients don't do their home exercises, and Promise Pals makes them more likely to. It costs cents per user to run.
- **"What if nobody's on the board?"** We launch through clinics and community centres so the board is full from day one, and invite links fill the gaps.
- **"What about iPhone users without a Fitbit?"** A photo works on any phone. Apple only lets App Store apps read Apple Health, so a native app is our next step.
- **"Is this real data?"** Yes: real Fitbit data, real City of Calgary communities, real accounts. The **See a demo** mode uses sample people and says so on screen.
- **"How did you use AI?"** Claude Code wrote the code, with our team designing, deciding and testing every step. Gemini only checks goals and photos inside the app, and every decision has a Why panel.
- **"How is it safe with strangers?"** First names only, no chat, no meet-ups, AI checks before anyone sees anything, 18+, report and leave in one tap.

---

**Fill in before recording:**
- [ ] Your team name (Part 1)
- [ ] Which tools your teammates used for the characters and mockups. Add one line to Part 7, for example: "Our teammate designed the characters in [tool]."
