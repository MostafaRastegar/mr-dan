/**
 * Study plan domain helpers.
 *
 * Pure domain: no external imports.
 */

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
