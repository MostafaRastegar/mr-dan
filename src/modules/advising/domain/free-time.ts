/**
 * Daily free-time budget: suggestion, capacity, fit check, Persian duration text.
 *
 * Pure domain. Minutes are integer minutes from local midnight; no rounding,
 * no Date, no external import. The 14h base is a domain constant, not env.
 */

export const WEEKLY_FREE_BASE_MINUTES = 840; // 14h waking-day planning base

export interface ClassInterval {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

/** Minutes awake in a day: ((sleep − wake + 1440) % 1440) || 1440. */
export function wakingMinutes({ wakeMinutes, sleepMinutes }: { wakeMinutes: number | null; sleepMinutes: number | null }): number {
  const wake = wakeMinutes ?? 390;   // 06:30 default
  const sleep = sleepMinutes ?? 1380; // 23:00 default
  return ((sleep - wake + 1440) % 1440) || 1440;
}

/** Sum of school-program minutes for a given weekday (derived, never typed twice). */
export function schoolMinutesForDay(school: readonly { dayOfWeek: number; minutes: number }[], dayOfWeek: number): number {
  let total = 0;
  for (const entry of school) {
    if (entry.dayOfWeek === dayOfWeek) total += entry.minutes;
  }
  return total;
}

/** Non-school occupied minutes for a weekday; missing index reads 0. */
export function otherOccupiedMinutesForDay(otherOccupiedMinutes: readonly number[], dayOfWeek: number): number {
  return otherOccupiedMinutes[dayOfWeek] ?? 0;
}

/** Free minutes = waking − school(derived) − non-school occupied − homework average, clamped at 0. */
export function freeMinutesForDay(input: {
  wakeMinutes: number | null;
  sleepMinutes: number | null;
  schoolMinutes: number;
  otherOccupiedMinutes: number;
  homeworkAverageMinutes: number | null;
}): number {
  const wake = wakingMinutes(input);
  const homework = input.homeworkAverageMinutes ?? 0;
  return Math.max(0, wake - input.schoolMinutes - input.otherOccupiedMinutes - homework);
}

export interface DayCapacity {
  freeMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
}

export function classMinutesForDay(
  entries: readonly ClassInterval[],
  dayOfWeek: number,
): number {
  const intervals = entries
    .filter((entry) => entry.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startMinute - b.startMinute);

  let total = 0;
  let currentStart: number | null = null;
  let currentEnd = 0;
  for (const interval of intervals) {
    if (currentStart === null) {
      currentStart = interval.startMinute;
      currentEnd = interval.endMinute;
    } else if (interval.startMinute <= currentEnd) {
      if (interval.endMinute > currentEnd) currentEnd = interval.endMinute;
    } else {
      total += currentEnd - currentStart;
      currentStart = interval.startMinute;
      currentEnd = interval.endMinute;
    }
  }
  if (currentStart !== null) total += currentEnd - currentStart;
  return total;
}

export function suggestFreeMinutes(
  entries: readonly ClassInterval[],
  dayOfWeek: number,
): number {
  return Math.max(0, WEEKLY_FREE_BASE_MINUTES - classMinutesForDay(entries, dayOfWeek));
}

export function dayCapacity(
  freeMinutes: number | null,
  usedMinutes: number,
): DayCapacity {
  const free = freeMinutes ?? 0;
  return {
    freeMinutes: free,
    usedMinutes,
    remainingMinutes: Math.max(0, free - usedMinutes),
  };
}

export function fitsCapacity(capacity: DayCapacity, additionalMinutes: number): boolean {
  return (
    additionalMinutes > 0 &&
    capacity.usedMinutes + additionalMinutes <= capacity.freeMinutes
  );
}

const persianDigits = new Intl.NumberFormat("fa-IR");

export function durationMessage(usedMinutes: number, freeMinutes: number): string {
  return `${formatMinutes(usedMinutes)} از ${formatMinutes(freeMinutes)}`;
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0 && rest === 0) return "۰ دقیقه";
  if (rest === 0) return `${persianDigits.format(hours)} ساعت`;
  if (hours === 0) return `${persianDigits.format(rest)} دقیقه`;
  return `${persianDigits.format(hours)} ساعت و ${persianDigits.format(rest)} دقیقه`;
}
