import type { DayMark } from "@/lib/rules";
import type { Today } from "@/lib/types";

// The week at a glance. Every mark also has words, so it never relies on colour.
const MARKS: Record<DayMark, { symbol: string; words: string; style: string }> = {
  done: { symbol: "✓", words: "done", style: "bg-accent text-white" },
  rough: { symbol: "~", words: "skipped", style: "bg-[#cfe0f5] text-ink" },
  missed: { symbol: "×", words: "missed", style: "bg-[#f7a58f] text-ink" },
  open: { symbol: "", words: "not yet", style: "bg-white text-muted" },
};

export function WeekGrid({ week }: { week: NonNullable<Today["pair"]>["week"] }) {
  const dayLetter = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "narrow", timeZone: "UTC" });
  const row = (label: string, who: "me" | "partner") => (
    <tr>
      <th scope="row" className="pr-2 text-left font-semibold">
        {label}
      </th>
      {week.map((day) => (
        <td key={day.date} className="p-0.5">
          <span className={`flex aspect-square w-full items-center justify-center border border-line rounded-md font-bold ${MARKS[day[who]].style}`}>
            <span aria-hidden="true">{MARKS[day[who]].symbol}</span>
            <span className="sr-only">{MARKS[day[who]].words}</span>
          </span>
        </td>
      ))}
    </tr>
  );

  return (
    <table className="w-full table-fixed border-separate border-spacing-0">
      <caption className="sr-only">This week's check-ins</caption>
      <colgroup>
        <col className="w-20" />
      </colgroup>
      <thead>
        <tr>
          <td />
          {week.map((day) => (
            <th key={day.date} scope="col" aria-current={day.isToday ? "date" : undefined} className={`pb-1 text-center font-semibold ${day.isToday ? "underline underline-offset-4" : "text-muted"}`}>
              {dayLetter(day.date)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {row("You", "me")}
        {row("Partner", "partner")}
      </tbody>
    </table>
  );
}
