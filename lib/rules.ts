// Every accountability rule lives in this file.
// Nothing here touches the database or the internet, so it is easy to test and explain.

export type CheckinStatus = "done" | "rough";
export type DayCheckins = Record<string, CheckinStatus | undefined>; // "2026-11-07" -> status

export const GOAL_TYPES = ["move", "recovery", "sleep", "routine", "mind", "other"] as const;
export type GoalType = (typeof GOAL_TYPES)[number];

export const SILENT_DAYS_BEFORE_NEW_MATCH = 2;
export const MATCH_ANY_TYPE_AFTER_SECONDS = 30; // first try to match the same goal type
export const TIME_ZONE = "America/Edmonton";

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  move: "Moving more",
  recovery: "Recovery or physio",
  sleep: "Sleep",
  routine: "Daily health routine",
  mind: "Mental well-being",
  other: "Something else",
};

// The only messages partners can send. There is no free chat, on purpose.
export const MESSAGES = [
  { id: "got-this", text: "You've got this." },
  { id: "thinking", text: "Thinking of you today." },
  { id: "rough-ok", text: "Rough days are okay." },
  { id: "still-here", text: "I'm still here." },
  { id: "tomorrow", text: "Tomorrow is a new day." },
  { id: "proud", text: "Proud of you for showing up." },
  { id: "together", text: "We're in this together." },
  { id: "small-step", text: "Even a small step counts." },
];

// What your character says: when you're matched, when you tap it, when you skip and when you check in.
// Written by the team. Kind, never shaming.
export const TALK = {
  found: ["You two are partners now. You will see each other’s check-ins."],
  motivation: [
    "One small step still counts.",
    "You showed up for yourself. That matters.",
    "Tiny wins add up!",
    "Be as kind to yourself as you would be to a friend.",
  ],
  skip: ["That’s okay. Rest is part of the plan.", "Hard day? Tomorrow is a fresh start.", "No stress. I’m right here."],
  checkin: ["Nice! Your partner just got the news.", "Done! Look at you go."],
  finished: ["You did it! Look how far you\u2019ve come.", "A whole week of showing up. That\u2019s huge."],
};

// Badges for your longest run of check-ins. Skipped days don't break a run, and missed days do.
export const BADGES = [
  { id: "first", name: "First step", days: 1 },
  { id: "three", name: "3 in a row", days: 3 },
  { id: "week", name: "One week", days: 7 },
  { id: "two-weeks", name: "Two weeks", days: 14 },
  { id: "habit", name: "21 days", days: 21 },
  { id: "month", name: "30 days", days: 30 },
];

// Points for checking in. Stronger proof earns more, so a Fitbit-proven day is worth the most.
export const POINTS = { done: 10, rough: 5, confirmed: 5, fitbit: 20 };

export function checkinPoints(checkin: { status: string; confirmed: boolean; fitbitSteps: number | null; fitbitWorkout?: string | null }): number {
  if (checkin.status !== "done") return POINTS.rough;
  const fitbitProved = (checkin.fitbitSteps ?? 0) > 0 || Boolean(checkin.fitbitWorkout);
  return POINTS.done + (checkin.confirmed ? POINTS.confirmed : 0) + (fitbitProved ? POINTS.fitbit : 0);
}

// Character extras you unlock with points. The number is the "Extras" option in lib/avatar.ts.
export const EXTRA_UNLOCKS: Record<number, number> = { 3: 30, 4: 60, 5: 100 };

export function extraLocked(extra: number, points: number): boolean {
  return points < (EXTRA_UNLOCKS[extra] ?? 0);
}

// A promise counts as finished after a full week.
export const PROMISE_DAYS = 7;

export const REPORT_REASONS = [
  { id: "goal", text: "Their goal made me uncomfortable" },
  { id: "unsafe", text: "I felt unsafe" },
  { id: "other", text: "Something else" },
];

// Confirm these details before the demo.
export const SUPPORT_LINKS = [
  { label: "Suicide Crisis Helpline: call or text 988", href: "tel:988" },
  { label: "Alberta Health Link: call 811", href: "tel:811" },
];

export const NOT_MEDICAL_CARE = "Promise Pals is not medical care. In an emergency, call 911.";

export const PRIVACY_LINE =
  "Your partner sees your first name, photo, Calgary community, goal and check-ins. Never your email, last name or exact address. Auth0 keeps your email and password.";

// Auth0's password rule for this app: 15 to 72 characters. A short phrase works well.
export const PASSWORD_RULE = "Use 15 or more characters. A short phrase works, like “tulip harbor 42”.";

export function strongEnough(password: string): boolean {
  return password.length >= 15 && password.length <= 72;
}

// --- Dates ---------------------------------------------------------------

// Calgary's date as "YYYY-MM-DD", moved forward by dayOffset for demo pairs.
export function todayIn(now: Date, dayOffset = 0): string {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
  return addDays(local, dayOffset);
}

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

// How many minutes past the check-in time it is. Negative means it's still early.
export function minutesPast(checkInTime: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const [nowHour, nowMinute] = parts.split(":").map(Number);
  const [hour, minute] = checkInTime.split(":").map(Number);
  return nowHour * 60 + nowMinute - (hour * 60 + minute);
}

// --- Streak and silence --------------------------------------------------

// Both done: +1. Anyone rough, nobody silent: streak is safe. Anyone silent: back to 0.
// Today can only add to the streak, because today isn't over yet.
export function sharedStreak(a: DayCheckins, b: DayCheckins, startedOn: string, today: string): number {
  let streak = 0;
  for (let day = startedOn; day < today; day = addDays(day, 1)) {
    if (a[day] === "done" && b[day] === "done") streak += 1;
    else if (!a[day] || !b[day]) streak = 0;
  }
  if (a[today] === "done" && b[today] === "done") streak += 1;
  return streak;
}

// How many finished days in a row this person has said nothing.
// The day you were matched doesn't count, because you may have joined at 11 PM.
export function silentDays(checkins: DayCheckins, startedOn: string, today: string): number {
  if (checkins[today]) return 0;
  let count = 0;
  for (let day = addDays(today, -1); day > startedOn; day = addDays(day, -1)) {
    if (checkins[day]) break;
    count += 1;
  }
  return count;
}

export function canOfferNewMatch(partnerCheckins: DayCheckins, startedOn: string, today: string): boolean {
  return silentDays(partnerCheckins, startedOn, today) >= SILENT_DAYS_BEFORE_NEW_MATCH;
}

// True on the first day after each full week together.
export function summaryDue(startedOn: string, today: string): boolean {
  const days = daysBetween(startedOn, today);
  return days > 0 && days % 7 === 0;
}

export type DayMark = "done" | "rough" | "missed" | "open";

// The 7 days of the current week, for both partners, shown as a simple grid.
// "open" means the day isn't over yet, or it's the day you were matched.
export function weekStrip(mine: DayCheckins, theirs: DayCheckins, startedOn: string, today: string) {
  const weekStart = addDays(startedOn, Math.floor(daysBetween(startedOn, today) / 7) * 7);
  const mark = (checkins: DayCheckins, day: string): DayMark => {
    if (checkins[day]) return checkins[day];
    return day < today && day > startedOn ? "missed" : "open";
  };
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    return { date, isToday: date === today, me: mark(mine, date), partner: mark(theirs, date) };
  });
}

export type HistoryDay = "done" | "skipped" | "missed";

// Your own days since you made your promise, oldest first, for the progress screen.
// The day you joined only counts if you checked in. Today only counts once you've checked in.
export function historyDays(checkins: DayCheckins, firstDay: string, today: string): { date: string; mark: HistoryDay }[] {
  const days: { date: string; mark: HistoryDay }[] = [];
  for (let day = firstDay; day <= today; day = addDays(day, 1)) {
    const status = checkins[day];
    if (status) days.push({ date: day, mark: status === "done" ? "done" : "skipped" });
    else if (day !== firstDay && day !== today) days.push({ date: day, mark: "missed" });
  }
  return days;
}

// Current run, best run and how many days were done. Skipped days keep a run going without adding to it.
export function personalStats(days: HistoryDay[]) {
  let run = 0;
  let best = 0;
  for (const day of days) {
    if (day === "done") best = Math.max(best, (run += 1));
    else if (day === "missed") run = 0;
  }
  const done = days.filter((day) => day === "done").length;
  return { done, total: days.length, current: run, best, percent: days.length ? Math.round((done / days.length) * 100) : 0 };
}

// --- The mascot ----------------------------------------------------------

// Your partner's character only ever looks calm, happy or caring.
// Their anger is private, so nobody gets shamed in front of a stranger.
export function partnerMood(checkin: CheckinStatus | null): MascotMood {
  if (checkin === "done") return "happy";
  if (checkin === "rough") return "caring";
  return "waiting";
}

export type MascotMood = "waiting" | "happy" | "proud" | "caring" | "sad" | "annoyed" | "mad" | "furious";

export type Mascot = {
  mood: MascotMood;
  angerLevel: 0 | 1 | 2 | 3;
  message: string;
  screenReaderText: string; // the mood in words, for people who can't see the art
};

function mascot(mood: MascotMood, angerLevel: Mascot["angerLevel"], message: string): Mascot {
  return { mood, angerLevel, message, screenReaderText: `Your character looks ${mood}. ${message}` };
}

// Your own character's moods. "caring" is only ever shown on your partner's character.
export const MASCOT_MOODS: MascotMood[] = ["waiting", "happy", "proud", "sad", "annoyed", "mad", "furious"];
export const ALL_MOODS: MascotMood[] = ["waiting", "happy", "proud", "caring", "sad", "annoyed", "mad", "furious"];

// The anger is playful, and a rough-day tap always calms it down.
// Anger depends only on how long you've been silent. It never insults anyone.
export function mascotFor(input: {
  myStatusToday?: CheckinStatus;
  mySilentDays: number;
  minutesPastCheckIn: number;
  partnerCheckedInToday: boolean;
  streak: number;
  gentle: boolean;
}): Mascot {
  const { myStatusToday, mySilentDays, minutesPastCheckIn, partnerCheckedInToday, streak, gentle } = input;

  if (myStatusToday === "rough") return mascot("sad", 0, "That's okay. Rest is part of the plan. I'm not mad.");
  if (myStatusToday === "done") {
    if (streak >= 3) return mascot("proud", 0, `${streak} days together. I might cry.`);
    return mascot("happy", 0, "You showed up. I'm very pleased.");
  }

  if (gentle) return mascot("waiting", 0, "Whenever you're ready. I'm here.");

  if (mySilentDays >= 2) return mascot("furious", 3, "Days of silence? I'm fuming. One tap and we're good.");
  if (mySilentDays === 1) return mascot("mad", 2, "You missed yesterday. Your partner noticed. So did I.");
  if (minutesPastCheckIn >= 120) return mascot("mad", 2, "You said you'd do this. We're both waiting.");
  if (minutesPastCheckIn >= 0) return mascot("annoyed", 1, "It's check-in time. I'm tapping my foot.");
  if (partnerCheckedInToday) return mascot("waiting", 0, "Your partner already checked in. No pressure. Some pressure.");
  return mascot("waiting", 0, "Check in when you're ready. I'll be here.");
}

// --- Goals ---------------------------------------------------------------

// Works even when the AI is down. Pressure around weight can be harmful, so we refuse these goals.
const WEIGHT_GOAL =
  /\b(lose|losing|lost|drop|dropping|shed|shedding|burn)\b.*\b(weight|pounds?|lbs?|kgs?|kilos?|fat)\b|\bweight[- ]?loss\b|\bskinny\b|\bcalories?\b|\bstarv/i;

export function looksLikeWeightGoal(goalText: string): boolean {
  return WEIGHT_GOAL.test(goalText);
}

export const WEIGHT_GOAL_REFUSAL =
  "We don't support weight goals, because pressure around weight can be harmful. Try a goal about how you want to feel or what you want to do.";

const ADJECTIVES = ["Brave", "Calm", "Kind", "Steady", "Sunny", "Gentle", "Bold", "Quiet", "Warm", "Bright"];
const ANIMALS = ["Otter", "Moose", "Heron", "Fox", "Lynx", "Magpie", "Beaver", "Owl", "Hare", "Bison"];

export function makeNickname(random: () => number = Math.random): string {
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(random() * ANIMALS.length)];
  return `${adjective} ${animal} ${Math.floor(random() * 90) + 10}`;
}
