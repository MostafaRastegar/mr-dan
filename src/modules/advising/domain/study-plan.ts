/**
 * Study plan domain helpers.
 *
 * Pure domain: no external imports.
 */

import { isDayKey, persianDayOf } from "./day-key";

export interface PlanEntryLike {
  id: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
}

export function planMinutesTotal(entries: readonly { minutes: number }[]): number {
  let total = 0;
  for (const entry of entries) total += entry.minutes;
  return total;
}

/** Copy each school-program row into a plan entry (same day/subject/minutes), deduped. */
export function suggestPlanFromSchool(
  school: readonly { dayOfWeek: number; subject: string; minutes: number }[],
): { dayOfWeek: number; subject: string; minutes: number }[] {
  const seen = new Set<string>();
  const out: { dayOfWeek: number; subject: string; minutes: number }[] = [];
  for (const row of school) {
    if (row.minutes <= 0) continue;
    const key = `${row.dayOfWeek}:${row.subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ dayOfWeek: row.dayOfWeek, subject: row.subject, minutes: row.minutes });
  }
  return out;
}

/** One log per plan entry: `${dayKey}:${entryId}` (legacy, full planned
 * minutes) or `${dayKey}:${entryId}:${minutes}` (logged amount). */
export function planEntryBlockKey(
  dayKey: string,
  entryId: string,
  minutes?: number,
): string {
  return minutes === undefined
    ? `${dayKey}:${entryId}`
    : `${dayKey}:${entryId}:${minutes}`;
}

export function parsePlanEntryBlockKey(
  key: string,
): { dayKey: string; entryId: string; minutes: number | null } | null {
  const [dayKey, entryId, rawMinutes] = key.split(":");
  if (!isDayKey(dayKey) || !entryId || entryId.includes(":")) return null;
  if (rawMinutes === undefined) return { dayKey, entryId, minutes: null };
  const minutes = Number(rawMinutes);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) return null;
  return { dayKey, entryId, minutes };
}

/** Logged minutes per plan entry; keys whose entry is gone (deleted or
 * replaced) are ignored so stale ticks never inflate progress. */
export function loggedMinutesByEntry(
  completedKeys: readonly string[],
  entries: readonly PlanEntryLike[],
): Record<string, number> {
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  const byEntry: Record<string, number> = {};
  for (const key of completedKeys) {
    const parsed = parsePlanEntryBlockKey(key);
    if (!parsed) continue;
    const entry = byId.get(parsed.entryId);
    if (!entry || persianDayOf(parsed.dayKey) !== entry.dayOfWeek) continue;
    byEntry[entry.id] = parsed.minutes ?? entry.minutes;
  }
  return byEntry;
}

/** Sums logged plan minutes per subject from the same rows. */
export function studiedMinutesBySubject(
  completedKeys: readonly string[],
  entries: readonly PlanEntryLike[],
): Record<string, number> {
  const byId = new Map(entries.map((entry) => [entry.id, entry] as const));
  const bySubject: Record<string, number> = {};
  for (const [entryId, minutes] of Object.entries(
    loggedMinutesByEntry(completedKeys, entries),
  )) {
    const entry = byId.get(entryId);
    if (!entry) continue;
    bySubject[entry.subject] = (bySubject[entry.subject] ?? 0) + minutes;
  }
  return bySubject;
}
