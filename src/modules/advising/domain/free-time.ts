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
