# Frontend and mobile handoff

Everything you need to build the web frontend and mobile app. The backend is finished and tested.

**A working web frontend already exists**, in `components/` and `app/`, so you can improve it instead of starting from scratch.

**The character is the team's pixel art**, moved from `avatar.py` into `lib/avatar.ts`, and it matches pixel for pixel. Draw it with `components/PixelAvatar.tsx`. The customize menu is `components/Customizer.tsx`. If you're building a separate app in another language, you'll need to port `lib/avatar.ts` too, or ask Amitoj about serving images from the backend.

**New fields:** `me.avatar`, `partner.avatar`, `partner.mood` and `pair.week` (7 days, each with `date`, `isToday`, `me` and `partner`, where each mark is `done`, `rough`, `missed` or `open`). Send `avatar` in `POST /api/join`, and save changes with `POST /api/settings` and `{ "avatar": "h2-c5-s3-e1-o4-k8-a1" }`. Only show your partner's mood from `partner.mood`, which never shows anger.

**Base URL:** `https://hackathon-gilt-iota.vercel.app` (sign-up won't work until the database is connected, so use `?demo=1` until then.)

**Coming next:** real accounts with email sign-up through Auth0, which will change how sign-in works in this doc.

## Start right now, with no setup

This returns labelled sample data, with no database or sign-in:

```
GET {BASE_URL}/api/today?demo=1&mood=mad
```

Moods: `waiting`, `happy`, `proud`, `caring`, `annoyed`, `mad`, `furious`.

Until it's deployed, copy the sample response at the bottom of this file into a local file.

## The 4 rules

1. **Save the token.** `POST /api/join` returns a `token` exactly once. Save it on the device (`localStorage` on web, secure storage on mobile). It's the person's only identity, and it can't be recovered.
2. **Send the token on every call:** `Authorization: Bearer <token>`
3. **Refresh every 3 seconds.** On the main screen, call `GET /api/today` every 3 seconds. This is how a partner's check-in appears live. Pause it when the app is in the background.
4. **Draw from the latest response.** Every action below returns the same fresh `today` object, so just replace what's on screen.

Every success looks like `{ data, source, fetchedAt }`.

Every failure looks like `{ error: { code, message } }`. The `message` is written for users, so show it as is. Never show raw JSON or error codes on screen.

## Screen 1: Make a promise

**On load:** `GET /api/config` gives you the goal types, messages, report reasons, support links and the privacy line. Don't hardcode them.

**On submit:** `POST /api/join`

```json
{ "goalText": "Do my physio every morning", "goalType": "recovery", "checkInTime": "08:00" }
```

- `goalText` is 3 to 200 characters. `checkInTime` is 24-hour `HH:MM`, Calgary time.
- This can take a few seconds because of the AI check, so show a loading state.

**Two possible answers:**

| Answer | What to show |
|---|---|
| `data.allowed: true` | Save `data.token`, then go to Screen 2 using `data.today` |
| `data.allowed: false` | Show `data.refusalReason` and let them edit the goal. Nothing was saved. If `data.showSupportLinks` is true, show `data.support` prominently |

**"Why?" panel:** show `data.why` after a refusal, or `today.me.why` after a success: what was checked (`textChecked`), `result`, what the partner sees (`partnerSees`), `source` and `checkedAt`.

Show the `privacyLine` on this screen.

## Screen 2: Today

Use `today.status` to decide what to show:

| `status` | Show |
|---|---|
| `waiting` | "Finding your partner", the mascot and `notice` if there is one. It can take up to about 30 seconds if nobody has the same goal type |
| `paired` | The full screen below |
| `left` | "You've left." and a button back to Screen 1 |

**When paired, show:**
- **Mascot:** `mascot.mood` and `mascot.message`. Give the image `alt={mascot.screenReaderText}`.
- **My goal:** `me.goal.text`
- **Buttons:** "Done" and "Rough day": `POST /api/checkin` with `{ "status": "done" }` or `{ "status": "rough" }`. Highlight the current `today.myCheckin`. Tapping again changes the answer.
- **Partner:** `partner.nickname`, `partner.goal`, and `partner.checkinToday` (`done`, `rough` or `null`). If `partner.goal` is `null`, show `partner.goalTypeLabel` instead.
- **Streak:** `pair.streak`
- **Week:** "Day `pair.dayOfWeek` of 7"
- **Messages from your partner:** `messagesReceived[].text`

## Screen 3: Show up for your partner

**Prompt:** when `partner.overdue` is true or `partner.checkinToday` is `rough`, show something like "Your partner could use a little support today."

**Send a message:** if `canSendMessage` is true, list `messages` from config as buttons: `POST /api/encourage` with `{ "messageId": "got-this" }`. There is no text box, on purpose. Never add one. One message per day.

**New match offer:** if `pair.canOfferNewMatch` or `pair.summaryDue` is true, offer a button: `POST /api/rematch`.

**Weekly summary:** when `pair.summaryDue` is true, call `GET /api/summary`. It returns `me` and `partner`, each with `{ done, rough, silent }`, plus `streak`.

**Always reachable:**
- **Leave:** `POST /api/leave`
- **Report:** `POST /api/report` with `{ "reason": "unsafe" }`, using `reportReasons` from config
- **Support links:** `today.support`, always visible, with `today.notMedicalCare`

## The mascot

Each person customizes their own character, and it has 7 moods. The backend decides the mood, so never work it out yourself.

| `mood` | `angerLevel` | When |
|---|---|---|
| `waiting` | 0 | Looking for a partner, or not check-in time yet |
| `happy` | 0 | Checked in today |
| `proud` | 0 | Checked in, with a streak of 3 or more |
| `caring` | 0 | Tapped "Rough day" |
| `annoyed` | 1 | Check-in time has passed |
| `mad` | 2 | 2+ hours late, or missed yesterday |
| `furious` | 3 | 2+ silent days |

Keep the anger playful, like a grumpy cartoon. Don't make it scary or shaming.

**Settings:** include a "Gentle mode" switch: `POST /api/settings` with `{ "gentleMascot": true }`. It stops all anger, for anyone who needs that. The same call can change the time: `{ "checkInTime": "09:30" }`.

## Accessibility (required)

- Body text is at least 18px, and contrast meets WCAG AA.
- Use real buttons and labels. Everything must work with a keyboard, with visible focus.
- Mood is never shown by colour or art alone. Always show the message too.
- Announce live changes to screen readers (`aria-live="polite"` on the partner status). Only announce when something changes, not every 3 seconds.
- Test with VoiceOver on a Mac and an iPhone.

## Demo mode

Add these controls only when `today.isDemo` is true, and always show a clear "Demo: sample partner" label.

- **Start a demo:** `POST /api/join` with `"demo": true` added. You're paired instantly with a sample partner.
- **Skip to tomorrow:** `POST /api/demo/skip-day`
- **Make the partner check in:** `POST /api/demo/partner-checkin` with `{ "status": "done" }`

**Good demo script:** check in, skip a day twice to make the mascot furious, tap "Rough day" to calm it, then skip two more days to show the new-match offer.

**No connection:** if `/api/today` fails, keep showing the last response, with "Last updated at <time>". If the whole server is unreachable, keep a saved copy of the sample response so the demo can still run, labelled as a demo.

## Real results page

`GET /api/stats` returns real counts that exclude demo data: `people`, `pairs`, `doneCheckins`, `roughDays`, `messagesSent`, `cameBackAfterDayOne`. Use these in a small results page for the pitch.

## Mobile notes

- **Mobile apps** can use the API directly. Web apps on other addresses are allowed too.
- **Reminders:** the mobile app can schedule a local notification at `me.checkInTime` on the device, without needing the backend. That answers "how do people remember?", so please add it if time allows.
- **Time zone:** check-in times are Calgary time.

## Sample `/api/today` response

```json
{
  "data": {
    "status": "paired",
    "isDemo": true,
    "me": {
      "nickname": "Demo Otter 42",
      "goal": {
        "text": "Do my physio exercises every morning",
        "partnerSees": "Do physio exercises every morning",
        "type": "recovery",
        "typeLabel": "Recovery or physio"
      },
      "checkInTime": "08:00",
      "gentleMascot": false,
      "why": {
        "textChecked": "Do my physio exercises every morning",
        "goalType": "recovery",
        "result": "Sample only. No check was run.",
        "removedPersonalInfo": false,
        "partnerSees": "Do physio exercises every morning",
        "source": "Demo sample",
        "checkedAt": "2026-11-07T17:20:55.806Z"
      }
    },
    "today": { "date": "2026-11-07", "myCheckin": null, "canCheckIn": true },
    "partner": {
      "nickname": "Demo Heron 17",
      "goal": "Take a 10-minute walk after lunch",
      "goalType": "recovery",
      "goalTypeLabel": "Recovery or physio",
      "checkinToday": "done",
      "overdue": false,
      "silentDays": 0
    },
    "pair": {
      "startedOn": "2026-11-03",
      "dayNumber": 5,
      "dayOfWeek": 5,
      "daysLeftThisWeek": 2,
      "streak": 0,
      "canOfferNewMatch": false,
      "summaryDue": false
    },
    "mascot": {
      "mood": "mad",
      "angerLevel": 2,
      "message": "You missed yesterday. Your partner noticed. So did I.",
      "screenReaderText": "The mascot looks mad. You missed yesterday. Your partner noticed. So did I."
    },
    "messagesReceived": [
      { "id": "thinking", "text": "Thinking of you today.", "sentAt": "2026-11-07T17:20:55.806Z" }
    ],
    "canSendMessage": true,
    "notice": null,
    "support": [
      { "label": "Suicide Crisis Helpline: call or text 988", "href": "tel:988" },
      { "label": "Alberta Health Link: call 811", "href": "tel:811" }
    ],
    "notMedicalCare": "Show Up is not medical care. In an emergency, call 911."
  },
  "source": "snapshot",
  "fetchedAt": "2026-11-07T17:20:55.806Z"
}
```

When someone is `waiting` or `left`, `partner` and `pair` are `null`, so check `status` first.
