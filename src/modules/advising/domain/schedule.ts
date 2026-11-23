/**
 * Schedule time helpers.
 *
 * Times are stored as minutes from local midnight (0..1439). Touching intervals
 * ([480,540) and [540,600)) do not overlap; containment, identical, and partial
 * overlaps do.
 */

export function clockToMinutes(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
