# Promise Pals: spec

**Prompt 1:** How can we leverage technology to promote health, social connection, and well-being in our communities?

**One line:** Get paired with one anonymous person working on a similar health goal, so someone is waiting on you each day.

## 1. The problem

Maya, 24, is a UCalgary student recovering from a knee injury. (Maya is a made-up example. Replace her with a real person the team talks to.) Her physio gave her exercises to do every morning. By week two she skips them, because nobody would know. Her friends are busy, and she feels awkward asking them to check up on her. Step counters don't count her exercises at all. At 8 AM, sitting on the edge of her bed, the easiest choice is to skip again. With Promise Pals, a stranger working through their own recovery is waiting on her check-in, and she is waiting on theirs.

## 2. The 3 screens

### Screen 1: Make a promise
- **On screen:** a goal box, goal type, daily check-in time, the app-generated nickname, and one line on what we store.
- **User does:** types a goal in their own words, picks a time, and taps "Find my partner".
- **Then:** Gemini checks the goal, with a "Why?" panel showing how it decided.
- **Data needed:** goal text, goal type, check-in time.

### Screen 2: Today (the main screen)
- **On screen:** my goal, big "Done" and "Rough day" buttons, my partner's status today, our shared streak, and days left in the week.
- **User does:** checks in. The partner's phone updates within a few seconds.
- **Data needed:** the pair, both people's check-ins.

### Screen 3: Show up for your partner
- **On screen:** "Your partner hasn't checked in today", pre-written messages, and a new-match offer after 2 silent days. Leave, report and support links are always visible.
- **User does:** sends a one-tap message, or chooses a new match.
- **Data needed:** check-in history, the list of pre-written messages.

## 3. How accountability works

These rules live in one short file, `lib/rules.ts`, so the whole team can explain them.

| Situation | What happens |
|---|---|
| Both partners check in | The shared streak goes up by 1 |
| One taps "Rough day" | Streak is safe. Partner sees a prompt to send kindness. It still shows in the weekly summary |
| One says nothing by the end of the day | Streak resets. Partner is told and can send a message |
| 2 days of silence with no rough-day tap | The person left behind is offered a new match |
| End of the week | Both see an honest summary and choose to stay paired or get a new match |

**The character:** everyone customizes their own pixel character, made by the team, and that's what their partner sees instead of a photo. It gets steadily madder the longer you're silent: waiting, annoyed, mad, furious. It's playful and never insults anyone. It stays calm on the day you join, a "Rough day" tap always calms it, and a "Gentle mode" setting turns the anger off. Your partner never sees your anger.

**Safety rules**
- No free chat, ever. Only pre-written messages.
- Partners never see real names, emails, photos or location. The app makes up the nickname.
- Goals about weight loss are refused, with a kind suggestion to choose a different goal.
- Partners only see the goal after it passes the safety check. If the check fails or is unavailable, they see only the goal type.
- Leave or report in one tap.
- Support links are always visible, and the app says it is not medical care.

## 4. Data plan

| Source | Used for | Status | Refresh | Fallback |
|---|---|---|---|---|
| Our own database, Tiger Data (Postgres) via `pg` | Goals, pairs, check-ins | Free plan found, not yet tested | Live, screens ask for updates every 3 seconds | `?demo=1`, with a sample partner clearly labelled "Demo" |
| Gemini, `gemini-3.5-flash-lite` | Goal safety check | Listed as stable in Google's docs, not yet tested | Once per goal | Ask the user to pick a goal type, and show only that to the partner |
| Google Health API (Fitbit) | Optional "activity confirmed" badge | UNCONFIRMED. The old Fitbit Web API was turned off. New projects may not be accepted | Once per check-in | Normal check-in, which always works |

- **Identity:** an email and password account through Auth0. Auth0 keeps the email and password, and we store neither.
- **Stored by us:** Auth0 id, character, nickname, goal text, goal type, check-in time, check-ins, messages sent and reports.
- **Numbers:** every figure shown or pitched comes from real use tonight or a cited source. Demo data is always labelled.
- **Time travel for testing:** `?demo=1` includes a labelled "skip to tomorrow" button, so a judge can see a missed day and a new match without waiting.

## 5. AI plan

**Gemini does one job:** it checks a goal before a stranger sees it.

**It receives:** only the goal text.

**It returns:**

```json
{
  "goalType": "recovery",
  "shortGoal": "Do physio exercises every morning",
  "allowed": true,
  "refusalReason": null,
  "containsPersonalInfo": false,
  "showSupportLinks": false
}
```

**The "Why?" panel shows:** the exact text sent, the goal type chosen, the check result, the source (Gemini) and the time.

**It is NOT allowed to:** give health advice, chat with users, invent numbers or write messages to partners. It also doesn't decide matches or streaks, because `lib/rules.ts` does that.

## 6. Out of scope

Free chat, friends mode, money or crypto, profiles and photos, leaderboards, wearables as a requirement, doctor or physio dashboards, AI coaching.

**Reminders:** the mobile app can set a reminder on the phone itself at the check-in time. The web version has no reminders.

## 7. Build list

Each step ends with something visible in the browser.

1. **By 11:45 AM:** scaffold and hello page live on Vercel.
2. **By 1:00 PM:** Screen 1 saves a real goal to the database.
3. **By 2:00 PM:** Gemini goal check and "Why?" panel, deployed.
4. **By 3:30 PM:** matching, so two phones get paired with each other.
5. **By 5:00 PM:** Screen 2 check-ins, with the partner's phone updating live.
6. **By 6:30 PM:** Screen 3 pre-written messages.
7. **By 8:00 PM:** streak, missed days and the new-match offer, written with the team in `lib/rules.ts`.
8. **By 9:00 PM:** leave, report and support links, and the refuse rules.
9. **By 10:00 PM:** pair real hackers using a QR code, plus a page of real results.
10. **By 1:00 AM:** accessibility pass with VoiceOver, and `?demo=1`.
11. **By 2:00 AM, only if a teammate confirmed access:** optional Google Health badge. Otherwise, skip it.
12. **3:00 AM freeze:** bug fixes, README, Devpost, video, then pitch practice. First submission by 9:30 AM.

## 8. For teammates (paste this)

Hi team, we're building Promise Pals: you get paired with an anonymous stranger on a similar health goal, so someone is waiting on you each day. Here's what we need right now:

**Teammate 1**
1. **Talk to a real person today.** Find someone doing physio or managing a chronic condition. Ask what makes it hard to keep going, and whether they'd want a stranger as a partner. Get permission before quoting them.
2. **Find 2-3 real statistics with sources.** Look for how many people drop home exercises, and Canadian loneliness numbers. Save the links, and don't use anything without a source.
3. **Check competitors for 10 minutes.** Look at Supporti, Focusmate and HabitShare. Can they pair strangers on any health goal, with rough days built in?

**Teammate 2**
1. **Check Fitbit access for 20 minutes.** The old Fitbit API has been switched off. Does the Google Health API accept new projects today? Does anyone here own a Fitbit? Ask a mentor too, since the event's list still shows Fitbit. If the answer isn't a clear yes, we skip it.
2. **Write 8 pre-written messages.** Keep them warm, short and easy to read, like "Thinking of you today." Nothing medical, and nothing guilt-tripping.
3. **Confirm support links.** Check the current details for 988 and Alberta's Health Link 811.
4. **Prepare tonight's test.** Make a QR poster and recruit 20 people in the building.

**Both of you, all weekend**
- Test every step on your phone, and report anything confusing.
- Read my short explanation after each step. Everyone must be able to explain how the code works, because the organizers require it.
