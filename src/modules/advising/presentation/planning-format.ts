/**
 * Presentation-layer formatting helpers for planning (D-2).
 *
 * Uses `Intl` with `fa-IR` for Persian digits; no hardcoded Persian digit
 * strings where `Intl` provides them.
 */

import { iranDayKey } from "../domain/day-key";
import type { HomeworkItem } from "../domain/models";

const timeFormatter = new Intl.NumberFormat("fa-IR", {
  minimumIntegerDigits: 2,
  useGrouping: false,
});

/** Persian digits without leading-zero padding (for chapter numbers, etc.). */
const persianDigits = new Intl.NumberFormat("fa-IR");

/** Persian-digit plain number for view layer. */
export function formatNumber(value: number): string {
  return persianDigits.format(value);
}

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

/**
 * Render a plan row's chapter ids as «فصل ۱، ۲، ۳», sorted by chapter number.
 * An id absent from the catalog renders «فصل نامشخص»; no ids → «—».
 */
export function formatChapterList(
  ids: readonly string[],
  chapters: readonly { id: string; number: number }[],
): string {
  if (ids.length === 0) return "—";
  const byId = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const known: { id: string; number: number }[] = [];
  let unknownCount = 0;
  for (const id of ids) {
    const chapter = byId.get(id);
    if (chapter) known.push(chapter);
    else unknownCount += 1;
  }
  known.sort((a, b) => a.number - b.number);
  const parts = known.map(
    (chapter) => `فصل ${persianDigits.format(chapter.number)}`,
  );
  for (let i = 0; i < unknownCount; i += 1) parts.push("فصل نامشخص");
  return parts.join("، ");
}

export type HomeworkStatus = "done" | "overdue" | "today" | "upcoming";

export function homeworkStatus(
  item: HomeworkItem,
  todayKey: string,
): HomeworkStatus {
  if (item.completedAt !== null) return "done";
  const deadlineKey = iranDayKey(item.deadline);
  if (deadlineKey < todayKey) return "overdue";
  if (deadlineKey === todayKey) return "today";
  return "upcoming";
}
