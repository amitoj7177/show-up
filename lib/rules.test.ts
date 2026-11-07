import { describe, expect, it } from "vitest";
import {
  canOfferNewMatch,
  looksLikeWeightGoal,
  mascotFor,
  minutesPast,
  partnerMood,
  sharedStreak,
  silentDays,
  summaryDue,
  todayIn,
  weekStrip,
} from "./rules";

const START = "2026-11-01";
const quiet = { mySilentDays: 0, minutesPastCheckIn: -60, partnerCheckedInToday: false, streak: 0, gentle: false };

describe("sharedStreak", () => {
  it("goes up when both are done", () => {
    const a = { "2026-11-01": "done", "2026-11-02": "done" } as const;
    expect(sharedStreak(a, a, START, "2026-11-03")).toBe(2);
  });

  it("stays safe, without growing, on a rough day", () => {
    const a = { "2026-11-01": "done", "2026-11-02": "rough", "2026-11-03": "done" } as const;
    const b = { "2026-11-01": "done", "2026-11-02": "done", "2026-11-03": "done" } as const;
    expect(sharedStreak(a, b, START, "2026-11-04")).toBe(2);
  });

  it("resets when someone is silent", () => {
    const a = { "2026-11-01": "done", "2026-11-03": "done" } as const;
    const b = { "2026-11-01": "done", "2026-11-02": "done", "2026-11-03": "done" } as const;
    expect(sharedStreak(a, b, START, "2026-11-04")).toBe(1);
  });

  it("doesn't reset just because today isn't finished", () => {
    const a = { "2026-11-01": "done" } as const;
    expect(sharedStreak(a, a, START, "2026-11-02")).toBe(1);
  });
});

describe("silentDays and new matches", () => {
  it("ignores the day you were matched", () => {
    expect(silentDays({}, START, "2026-11-02")).toBe(0);
  });

  it("counts finished days of silence", () => {
    expect(silentDays({}, START, "2026-11-04")).toBe(2);
  });

  it("a rough-day tap isn't silence", () => {
    expect(silentDays({ "2026-11-03": "rough" }, START, "2026-11-04")).toBe(0);
  });

  it("checking in today clears it", () => {
    expect(silentDays({ "2026-11-04": "done" }, START, "2026-11-04")).toBe(0);
  });

  it("offers a new match only after 2 silent days", () => {
    expect(canOfferNewMatch({}, START, "2026-11-03")).toBe(false);
    expect(canOfferNewMatch({}, START, "2026-11-04")).toBe(true);
    expect(canOfferNewMatch({ "2026-11-03": "rough" }, START, "2026-11-04")).toBe(false);
  });
});

describe("mascotFor", () => {
  it("waits before check-in time", () => {
    expect(mascotFor(quiet).mood).toBe("waiting");
  });

  it("gets steadily angrier", () => {
    expect(mascotFor({ ...quiet, minutesPastCheckIn: 5 }).mood).toBe("annoyed");
    expect(mascotFor({ ...quiet, minutesPastCheckIn: 130 }).mood).toBe("mad");
    expect(mascotFor({ ...quiet, mySilentDays: 1 }).mood).toBe("mad");
    expect(mascotFor({ ...quiet, mySilentDays: 2 }).mood).toBe("furious");
  });

  it("a rough day always calms it, however long the silence", () => {
    const result = mascotFor({ ...quiet, myStatusToday: "rough", mySilentDays: 5 });
    expect(result.mood).toBe("caring");
    expect(result.angerLevel).toBe(0);
  });

  it("is pleased, then proud", () => {
    expect(mascotFor({ ...quiet, myStatusToday: "done", streak: 1 }).mood).toBe("happy");
    expect(mascotFor({ ...quiet, myStatusToday: "done", streak: 3 }).mood).toBe("proud");
  });

  it("never gets angry in gentle mode", () => {
    expect(mascotFor({ ...quiet, mySilentDays: 5, gentle: true }).angerLevel).toBe(0);
  });

  it("describes itself for screen readers", () => {
    expect(mascotFor(quiet).screenReaderText).toContain("looks waiting");
  });
});

describe("weekStrip", () => {
  it("marks each day honestly", () => {
    const mine = { "2026-11-01": "done", "2026-11-03": "rough" } as const;
    const week = weekStrip(mine, {}, START, "2026-11-04");
    expect(week.map((day) => day.me)).toEqual(["done", "missed", "rough", "open", "open", "open", "open"]);
    expect(week[3].isToday).toBe(true);
  });

  it("doesn't count the day you were matched as missed", () => {
    expect(weekStrip({}, {}, START, "2026-11-02")[0].partner).toBe("open");
  });

  it("moves on to week two", () => {
    expect(weekStrip({}, {}, START, "2026-11-09")[0].date).toBe("2026-11-08");
  });
});

describe("partnerMood", () => {
  it("never shows a partner's anger", () => {
    expect(partnerMood(null)).toBe("waiting");
    expect(partnerMood("done")).toBe("happy");
    expect(partnerMood("rough")).toBe("caring");
  });
});

describe("looksLikeWeightGoal", () => {
  it("catches weight goals", () => {
    for (const goal of ["Lose 20 pounds", "I want to burn fat", "weight loss", "eat 800 calories", "get skinny"]) {
      expect(looksLikeWeightGoal(goal)).toBe(true);
    }
  });

  it("allows normal goals", () => {
    for (const goal of ["Do my physio every morning", "Walk to the mailbox", "Lift weights twice a week", "Sleep by 11"]) {
      expect(looksLikeWeightGoal(goal)).toBe(false);
    }
  });
});

describe("dates", () => {
  it("uses Calgary's date, not UTC's", () => {
    expect(todayIn(new Date("2026-11-08T03:00:00Z"))).toBe("2026-11-07");
  });

  it("moves forward for demo pairs", () => {
    expect(todayIn(new Date("2026-11-08T03:00:00Z"), 2)).toBe("2026-11-09");
  });

  it("works out minutes past check-in", () => {
    const tenAm = new Date("2026-11-07T16:00:00Z");
    const calgary = new Intl.DateTimeFormat("en-GB", {
      timeZone: "America/Edmonton",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(tenAm);
    const [hour] = calgary.split(":").map(Number);
    expect(minutesPast(`${String(hour - 1).padStart(2, "0")}:00`, tenAm)).toBe(60);
  });
});

describe("summaryDue", () => {
  it("is due the day after each full week", () => {
    expect(summaryDue(START, "2026-11-07")).toBe(false);
    expect(summaryDue(START, "2026-11-08")).toBe(true);
    expect(summaryDue(START, "2026-11-09")).toBe(false);
  });
});
