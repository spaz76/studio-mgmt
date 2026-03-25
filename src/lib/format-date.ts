/**
 * Formats a Date into 3 separate display parts for event date cells.
 * Returns { day, date, time } in Hebrew.
 * Example: { day: "ראשון", date: "22.3.2026", time: "16:30" }
 */
export function formatEventDate(d: Date): {
  day: string;
  date: string;
  time: string;
} {
  const dayName = new Intl.DateTimeFormat("he-IL", { weekday: "long" }).format(d);

  const day2 = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const dateStr = `${day2}.${month}.${year}`;

  const timeStr = new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

  return { day: dayName, date: dateStr, time: timeStr };
}
