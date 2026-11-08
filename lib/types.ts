// The shapes the API sends back. docs/FRONTEND.md explains each field.
import type { NearbyPerson, TeamRequest } from "./nearby";
import type { CheckinStatus, DayMark, MascotMood } from "./rules";

export type Why = {
  textChecked: string;
  goalType: string;
  result: string;
  removedPersonalInfo: boolean;
  partnerSees: string;
  source: string;
  checkedAt: string;
};

export type SupportLink = { label: string; href: string };

export type Today = {
  status: "waiting" | "paired" | "left";
  isDemo: boolean;
  me: {
    points: number;
    nickname: string;
    avatar: string;
    group: string | null;
    firstName?: string | null;
    photoId?: string | null;
    communityName?: string | null;
    moveTag?: string | null;
    area?: string | null;
    whyItMatters?: string | null;
    goal: { text: string; partnerSees: string | null; type: string; typeLabel: string };
    checkInTime: string;
    gentleMascot: boolean;
    why: Why;
  };
  today: { date: string; myCheckin: CheckinStatus | null; canCheckIn: boolean; seenByPartnerAt?: string | null; proof?: Proof | null };
  partner: {
    nickname: string;
    avatar: string;
    mood: MascotMood;
    goal: string | null;
    goalType: string;
    goalTypeLabel: string;
    checkinToday: CheckinStatus | null;
    overdue: boolean;
    silentDays: number;
    firstName?: string | null;
    photoId?: string | null;
    communityName?: string | null;
    moveTag?: string | null;
    area?: string | null;
    whyItMatters?: string | null;
    proof?: Proof | null;
    activeNow?: boolean;
    lastActiveAt?: string;
    checkedInAt?: string | null;
  } | null;
  pair: {
    startedOn: string;
    dayNumber: number;
    dayOfWeek: number;
    daysLeftThisWeek: number;
    streak: number;
    week: { date: string; isToday: boolean; me: DayMark; partner: DayMark }[];
    canOfferNewMatch: boolean;
    summaryDue: boolean;
  } | null;
  mascot: { mood: MascotMood; angerLevel: number; message: string; screenReaderText: string };
  messagesReceived: { id: string; text: string; sentAt: string }[];
  canSendMessage: boolean;
  notice: string | null;
  nearby?: { people: NearbyPerson[]; requests: TeamRequest[] } | null;
  support: SupportLink[];
  notMedicalCare: string;
};

export type Config = {
  goalTypes: { id: string; label: string }[];
  messages: { id: string; text: string }[];
  talk: { found: string[]; motivation: string[]; skip: string[]; checkin: string[]; finished: string[] };
  badges: { id: string; name: string; days: number }[];
  reportReasons: { id: string; text: string }[];
  support: SupportLink[];
  notMedicalCare: string;
  privacyLine: string;
  sources: { name: string; url: string; licence: string; usedFor: string }[];
};

export type JoinResult =
  | { allowed: true; token: string; today: Today }
  | { allowed: false; refusalReason: string; showSupportLinks: boolean; support: SupportLink[]; why: Why };

export type Summary = {
  from: string;
  to: string;
  streak: number;
  me: { done: number; rough: number; silent: number };
  partner: { done: number; rough: number; silent: number };
};

export type Stats = {
  people: number;
  pairs: number;
  doneCheckins: number;
  roughDays: number;
  messagesSent: number;
  cameBackAfterDayOne: number;
};

// A screen calls this to do something, like checking in. It replaces what's on screen.
export type Act = (path: string, body?: object) => Promise<void>;

export type History = {
  promise: string;
  days: { date: string; mark: "done" | "skipped" | "missed" }[];
  finished: boolean;
};

export type Proof = { photoId: string | null; note: string | null; confirmedAt: string | null; fitbitSteps?: number | null; fitbitWorkout?: string | null; fitbitActiveMinutes?: number | null };

export type Profile = {
  avatar: string;
  firstName: string | null;
  community: string | null;
  communityName: string | null;
  moves: string | null;
  hasPhoto: boolean;
  photoId: string | null;
  adult: boolean;
  hasPromise: boolean;
  profileComplete: boolean;
};
