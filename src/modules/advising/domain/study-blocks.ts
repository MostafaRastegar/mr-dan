/**
 * 50/10 study blocks derived from a schedule row.
 *
 * Pure domain: minutes from local midnight, no Date and no external import.
 * Breaks only separate two studies; a trailing remainder under `STUDY_MINUTES`
 * is not a block. An entry shorter than `STUDY_MINUTES` is one block of its own
 * length.
 */

import { isDayKey } from "./day-key";

export const STUDY_MINUTES = 50;
export const BREAK_MINUTES = 10;

export interface StudyBlock {
  dayKey: string;
  startMinute: number;
  minutes: number;
  subject: string | null;
}

export function buildStudyBlocks(input: {
  dayKey: string;
  startMinute: number;
  endMinute: number;
  subject: string | null;
}): StudyBlock[] {
  const total = input.endMinute - input.startMinute;
  if (total <= 0) return [];
  if (total < STUDY_MINUTES) {
    return [{ dayKey: input.dayKey, startMinute: input.startMinute, minutes: total, subject: input.subject }];
  }

  const blocks: StudyBlock[] = [];
  let startMinute = input.startMinute;
  let remaining = total;
  while (remaining >= STUDY_MINUTES) {
    blocks.push({ dayKey: input.dayKey, startMinute, minutes: STUDY_MINUTES, subject: input.subject });
    startMinute += STUDY_MINUTES;
    remaining -= STUDY_MINUTES;
    if (remaining <= BREAK_MINUTES) break;
    startMinute += BREAK_MINUTES;
    remaining -= BREAK_MINUTES;
  }
  return blocks;
}

export function studyBlockKey(block: StudyBlock): string {
  return `${block.dayKey}:${block.startMinute}:${block.minutes}`;
}

export function parseStudyBlockKey(key: string): StudyBlock | null {
  const [dayKey, startMinute, minutes] = key.split(":");
  if (!dayKey || !isDayKey(dayKey)) return null;
  const start = Number(startMinute);
  const length = Number(minutes);
  if (!Number.isInteger(start) || start < 0 || start > 1439) return null;
  if (!Number.isInteger(length) || length < 1 || length > 1440) return null;
  return { dayKey, startMinute: start, minutes: length, subject: null };
}
