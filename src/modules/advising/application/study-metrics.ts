/**
 * Pure time-analysis functions for the study timer.
 *
 * All day boundaries use a fixed UTC+03:30 offset (D-3). No external imports,
 * no Date mutation — pure functions over `StudySessionRecord` domain rows.
 */

import type { StudySessionRecord } from "@/modules/advising/domain/models";

export const IRAN_UTC_OFFSET_MINUTES = 210; // UTC+03:30; Iran has no DST since 2022 (D-3)

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function startOfStudyDay(
  instant: Date,
  offsetMinutes: number = IRAN_UTC_OFFSET_MINUTES,
): Date {
  const ms = instant.getTime() + offsetMinutes * 60 * 1000;
  const dayStartMs = Math.floor(ms / MS_PER_DAY) * MS_PER_DAY;
  return new Date(dayStartMs - offsetMinutes * 60 * 1000);
}

export function studyDayKey(
  instant: Date,
  offsetMinutes: number = IRAN_UTC_OFFSET_MINUTES,
): string {
  const shifted = instant.getTime() + offsetMinutes * 60 * 1000;
  return new Date(shifted).toISOString().slice(0, 10);
}

export function summarizeMinutes(
  rows: StudySessionRecord[],
): { study: number; break: number; waste: number; total: number } {
  let study = 0;
  let breakMin = 0;
  let waste = 0;
  for (const row of rows) {
    if (row.category === "study") study += row.durationMinutes;
    else if (row.category === "break") breakMin += row.durationMinutes;
    else if (row.category === "waste") waste += row.durationMinutes;
  }
  return { study, break: breakMin, waste, total: study + breakMin + waste };
}

export function productivityRate(
  study: number,
  breakMin: number,
  waste: number,
): number {
  const denominator = study + breakMin + waste;
  if (denominator === 0) return 0;
  return study / denominator;
}

export function perDaySeries(
  rows: StudySessionRecord[],
  from: Date,
  days: number,
): { day: string; minutes: number }[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = studyDayKey(row.startedAt);
    byDay.set(key, (byDay.get(key) ?? 0) + row.durationMinutes);
  }

  const series: { day: string; minutes: number }[] = [];
  const fromDay = startOfStudyDay(from);
  for (let i = 0; i < days; i++) {
    const d = new Date(fromDay.getTime() + i * MS_PER_DAY);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, minutes: byDay.get(key) ?? 0 });
  }
  return series;
}

export function perSubjectTotals(
  rows: StudySessionRecord[],
): { subject: string | null; minutes: number }[] {
  const bySubject = new Map<string | null, number>();
  for (const row of rows) {
    if (row.category !== "study") continue;
    bySubject.set(row.subject, (bySubject.get(row.subject) ?? 0) + row.durationMinutes);
  }
  return [...bySubject.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes || subjectLabelCompare(a.subject, b.subject));
}

function subjectLabelCompare(a: string | null, b: string | null): number {
  const la = a === null ? "بدون درس" : a;
  const lb = b === null ? "بدون درس" : b;
  return la.localeCompare(lb, "fa");
}

export function averageFocus(rows: StudySessionRecord[]): number | null {
  let sum = 0;
  let count = 0;
  for (const row of rows) {
    if (row.category === "study" && row.focusLevel !== null) {
      sum += row.focusLevel;
      count += 1;
    }
  }
  if (count === 0) return null;
  return Math.round((sum / count) * 10) / 10;
}
