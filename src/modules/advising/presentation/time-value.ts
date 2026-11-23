/**
 * Duck-typed conversion of antd picker values at the form boundary.
 *
 * The picker's backing library is not resolvable from app code (B-8), so only
 * the formatter object the picker hands us is read:
 * `hour()`/`minute()` for `TimePicker`, `format()` for `DatePicker`.
 * No library import and no cast; the shape is proven by a type guard.
 */

import { isDayKey } from "../domain/day-key";

interface TimeFormatter {
  hour(): number;
  minute(): number;
}

interface DateFormatter {
  format(pattern: string): string;
}

const MINUTES_PER_DAY = 24 * 60;

export function durationToMinutes(value: unknown): number | null {
  if (!isTimeFormatter(value)) return null;
  const minutes = value.hour() * 60 + value.minute();
  return isMinuteOfDay(minutes) ? minutes : null;
}

export function dateToDayKey(value: unknown): string | null {
  if (!isDateFormatter(value)) return null;
  const dayKey = value.format("YYYY-MM-DD");
  return isDayKey(dayKey) ? dayKey : null;
}

function isTimeFormatter(value: unknown): value is TimeFormatter {
  return (
    typeof value === "object" &&
    value !== null &&
    "hour" in value &&
    typeof value.hour === "function" &&
    "minute" in value &&
    typeof value.minute === "function"
  );
}

function isDateFormatter(value: unknown): value is DateFormatter {
  return (
    typeof value === "object" &&
    value !== null &&
    "format" in value &&
    typeof value.format === "function"
  );
}

function isMinuteOfDay(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= 0 && minutes < MINUTES_PER_DAY;
}
