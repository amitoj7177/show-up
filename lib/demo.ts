import { findCommunity } from "./calgary";
import {
  GOAL_TYPE_LABELS,
  MASCOT_MOODS,
  mascotFor,
  NOT_MEDICAL_CARE,
  partnerMood,
  SUPPORT_LINKS,
  todayIn,
  weekStrip,
  type CheckinStatus,
  type DayCheckins,
  type MascotMood,
} from "./rules";

// GET /api/today?demo=1 returns this. It needs no database and no sign-in,
// so the frontend can be built right now and the demo survives bad WiFi.
// Everything in it is sample data, and isDemo: true means the UI must say so.
const MOOD_INPUTS: Record<MascotMood, Parameters<typeof mascotFor>[0]> = {
  waiting: { mySilentDays: 0, minutesPastCheckIn: -60, partnerCheckedInToday: true, streak: 4, gentle: false },
  happy: { myStatusToday: "done", mySilentDays: 0, minutesPastCheckIn: 5, partnerCheckedInToday: true, streak: 1, gentle: false },
  proud: { myStatusToday: "done", mySilentDays: 0, minutesPastCheckIn: 5, partnerCheckedInToday: true, streak: 5, gentle: false },
  caring: { myStatusToday: "rough", mySilentDays: 0, minutesPastCheckIn: 5, partnerCheckedInToday: true, streak: 4, gentle: false },
  sad: { myStatusToday: "rough", mySilentDays: 0, minutesPastCheckIn: 5, partnerCheckedInToday: true, streak: 4, gentle: false },
  annoyed: { mySilentDays: 0, minutesPastCheckIn: 15, partnerCheckedInToday: true, streak: 4, gentle: false },
  mad: { mySilentDays: 1, minutesPastCheckIn: 15, partnerCheckedInToday: true, streak: 0, gentle: false },
  furious: { mySilentDays: 2, minutesPastCheckIn: 15, partnerCheckedInToday: true, streak: 0, gentle: false },
};

// Two real Calgary communities for the sample people.
const DEMO_ME_COMMUNITY = "HIL";
const DEMO_PARTNER_COMMUNITY = "BRD";

export const DEMO_AVATAR = "h2-c5-s3-e1-o1-k7-a1";
const DEMO_PARTNER_AVATAR = "h3-c3-s1-e2-o0-k9-a0";

export function demoToday(requestedMood: string | null, now = new Date()) {
  const mood = MASCOT_MOODS.find((option) => option === requestedMood) ?? "waiting";
  const input = MOOD_INPUTS[mood];
  const today = todayIn(now);
  const startedOn = todayIn(now, -4);
  const partnerStatus: CheckinStatus = "done";

  // Sample history that matches the mood being shown.
  const mine: DayCheckins = {};
  const theirs: DayCheckins = {};
  for (let back = 4; back >= 1; back -= 1) {
    const day = todayIn(now, -back);
    theirs[day] = "done";
    if (back > input.mySilentDays) mine[day] = "done";
  }
  theirs[today] = partnerStatus;
  if (input.myStatusToday) mine[today] = input.myStatusToday;

  return {
    status: "paired" as const,
    isDemo: true,
    me: {
      nickname: "Alex",
      firstName: "Alex",
      photoId: null,
      communityName: findCommunity(DEMO_ME_COMMUNITY)?.name ?? null,
      area: findCommunity(DEMO_ME_COMMUNITY)?.area ?? null,
      whyItMatters: "I want my knee strong enough to hike with my family again.",
      group: null,
      avatar: DEMO_AVATAR,
      goal: {
        text: "Do my physio exercises every morning",
        partnerSees: "Do physio exercises every morning",
        type: "recovery",
        typeLabel: GOAL_TYPE_LABELS.recovery,
      },
      checkInTime: "08:00",
      gentleMascot: false,
      why: {
        textChecked: "Do my physio exercises every morning",
        goalType: "recovery",
        result: "Sample only. No check was run.",
        removedPersonalInfo: false,
        partnerSees: "Do physio exercises every morning",
        source: "Demo sample",
        checkedAt: now.toISOString(),
      },
    },
    today: {
      date: today,
      myCheckin: input.myStatusToday ?? null,
      canCheckIn: true,
      seenByPartnerAt: input.myStatusToday ? new Date(now.getTime() - 5 * 60_000).toISOString() : null,
      proof: input.myStatusToday === "done" ? { photoId: null, note: null, confirmedAt: null } : null,
    },
    partner: {
      nickname: "Sam",
      firstName: "Sam",
      photoId: null,
      communityName: findCommunity(DEMO_PARTNER_COMMUNITY)?.name ?? null,
      area: findCommunity(DEMO_PARTNER_COMMUNITY)?.area ?? null,
      whyItMatters: "Walking clears my head after long shifts.",
      proof: { photoId: null, note: "A walk along the river path", confirmedAt: null },
      avatar: DEMO_PARTNER_AVATAR,
      mood: partnerMood(partnerStatus),
      goal: "Take a 10-minute walk after lunch",
      goalType: "recovery",
      goalTypeLabel: GOAL_TYPE_LABELS.recovery,
      checkinToday: partnerStatus,
      overdue: false,
      silentDays: 0,
      activeNow: true,
      lastActiveAt: now.toISOString(),
      checkedInAt: new Date(now.getTime() - 47 * 60_000).toISOString(),
    },
    pair: {
      startedOn,
      dayNumber: 5,
      dayOfWeek: 5,
      daysLeftThisWeek: 2,
      streak: input.streak,
      week: weekStrip(mine, theirs, startedOn, today),
      canOfferNewMatch: false,
      summaryDue: false,
    },
    mascot: mascotFor(input),
    messagesReceived: [{ id: "thinking", text: "Thinking of you today.", sentAt: now.toISOString() }],
    canSendMessage: true,
    notice: null,
    support: SUPPORT_LINKS,
    notMedicalCare: NOT_MEDICAL_CARE,
  };
}
