/**
 * Iran calendar-day keys.
 *
 * Fixed UTC+03:30 offset; Iran has no DST since 2022. No external imports.
 */

export const IRAN_UTC_OFFSET_MINUTES = 210; // UTC+03:30

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * MS_PER_MINUTE;

export function iranDayKey(instant: Date): string {
  const shifted = instant.getTime() + IRAN_UTC_OFFSET_MINUTES * MS_PER_MINUTE;
  return new Date(shifted).toISOString().slice(0, 10);
}

export function startOfIranDay(instant: Date): Date {
  const shifted = instant.getTime() + IRAN_UTC_OFFSET_MINUTES * MS_PER_MINUTE;
  const dayStartMs = Math.floor(shifted / MS_PER_DAY) * MS_PER_DAY;
  return new Date(dayStartMs - IRAN_UTC_OFFSET_MINUTES * MS_PER_MINUTE);
}

export function shiftDayKey(dayKey: string, days: number): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const base = utcDate(year, month, day);
  return new Date(base.getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
}

export function isDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = utcDate(year, month, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Persian weekday index of a day key: 0 = شنبه … 6 = جمعه (jsDay 6 = Saturday = 0). */
export function persianDayOf(dayKey: string): number {
  const [year, month, day] = dayKey.split("-").map(Number);
  return (utcDate(year, month, day).getUTCDay() + 1) % 7;
}

/** `Date.UTC` maps years 0..99 to 1900..1999; set the year explicitly instead. */
function utcDate(year: number, month: number, day: number): Date {
  const date = new Date(Date.UTC(2000, month - 1, day));
  date.setUTCFullYear(year);
  return date;
}
