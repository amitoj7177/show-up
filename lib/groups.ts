import { hashToken } from "./auth";
import { query } from "./db";
import { addDays, daysBetween, todayIn } from "./rules";

// Staff only ever see totals, and only once a clinic has enough people that nobody can be singled out.
export const MIN_PEOPLE_FOR_TOTALS = 5;

export type GroupRow = { id: string; name: string; join_code: string };

export async function findGroupByCode(code: string): Promise<GroupRow | undefined> {
  const [group] = await query<GroupRow>("SELECT id, name, join_code FROM groups WHERE join_code = $1", [code]);
  return group;
}

export async function findGroupByStaffKey(staffKey: string): Promise<GroupRow | undefined> {
  const [group] = await query<GroupRow>("SELECT id, name, join_code FROM groups WHERE staff_key_hash = $1", [hashToken(staffKey)]);
  return group;
}

export type GroupTotals = {
  name: string;
  joinCode: string;
  people: number;
  enoughPeople: boolean;
  minimumPeople: number;
  week?: {
    checkInRate: number; // done days divided by possible days, as a whole percent
    doneDays: number;
    skippedDays: number;
    pairedNow: number;
    cameBackAfterDayOne: number;
    days: { date: string; done: number; skipped: number }[];
  };
};

// Anonymous totals for the last 7 days. Never names, goals or anything about one person.
export async function groupTotals(group: GroupRow, now = new Date()): Promise<GroupTotals> {
  const today = todayIn(now);
  const from = addDays(today, -6);
  const members = await query<{ id: string; joined: string; status: string }>(
    `SELECT id, (created_at AT TIME ZONE 'America/Edmonton')::date::text AS joined, status
       FROM users WHERE group_id = $1 AND NOT is_demo`,
    [group.id],
  );
  const base = { name: group.name, joinCode: group.join_code, people: members.length, minimumPeople: MIN_PEOPLE_FOR_TOTALS };
  if (members.length < MIN_PEOPLE_FOR_TOTALS) return { ...base, enoughPeople: false };

  const checkins = await query<{ user_id: string; day: string; status: "done" | "rough" }>(
    `SELECT c.user_id, c.day, c.status FROM checkins c JOIN users u ON u.id = c.user_id
      WHERE u.group_id = $1 AND NOT u.is_demo AND c.day >= $2`,
    [group.id, from],
  );

  // Each person could have checked in once a day since they joined, within this week.
  const possibleDays = members.reduce((total, member) => {
    const start = member.joined > from ? member.joined : from;
    return total + Math.max(0, daysBetween(start, today) + 1);
  }, 0);
  const doneDays = checkins.filter((row) => row.status === "done").length;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(from, index);
    const onDay = checkins.filter((row) => row.day === date);
    return { date, done: onDay.filter((row) => row.status === "done").length, skipped: onDay.filter((row) => row.status === "rough").length };
  });
  const cameBack = new Set(checkins.filter((row) => row.day > (members.find((m) => m.id === row.user_id)?.joined ?? "")).map((row) => row.user_id));

  return {
    ...base,
    enoughPeople: true,
    week: {
      checkInRate: possibleDays ? Math.round((doneDays / possibleDays) * 100) : 0,
      doneDays,
      skippedDays: checkins.length - doneDays,
      pairedNow: members.filter((member) => member.status === "paired").length,
      cameBackAfterDayOne: cameBack.size,
      days,
    },
  };
}
