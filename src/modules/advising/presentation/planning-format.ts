/**
 * Presentation-layer formatting helpers for planning (D-2).
 *
 * Uses `Intl` with `fa-IR` for Persian digits; no hardcoded Persian digit
 * strings where `Intl` provides them.
 */

import type { HomeworkItem } from "../domain/models";

const IRAN_OFFSET_MINUTES = 210; // UTC+03:30

const timeFormatter = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${timeFormatter.format(h)}:${timeFormatter.format(m)}`;
}

export function formatDeadline(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    calendar: "gregory",
  }).format(date);
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${timeFormatter.format(h)}س ${timeFormatter.format(m)}د`;
  }
  return `${timeFormatter.format(m)}د`;
}

function toIranDayKey(date: Date): string {
  const shifted = date.getTime() + IRAN_OFFSET_MINUTES * 60 * 1000;
  return new Date(shifted).toISOString().slice(0, 10);
}

export type HomeworkStatus = "done" | "overdue" | "today" | "upcoming";

export function homeworkStatus(
  item: HomeworkItem,
  todayKey: string,
): HomeworkStatus {
  if (item.completedAt !== null) return "done";
  const deadlineKey = toIranDayKey(item.deadline);
  if (deadlineKey < todayKey) return "overdue";
  if (deadlineKey === todayKey) return "today";
  return "upcoming";
}
