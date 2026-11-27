/**
 * Chapter catalog validation (Decision 10).
 *
 * Pure domain: no external imports. A chapter applies to a student when it is
 * active, matches the subject, and either has an empty field (عمومی — all
 * fields) or matches the student's field. Grade is catalog metadata only: the
 * catalog may not carry chapters for every grade, so it never blocks a plan.
 */

import type { Chapter } from "./models";

export type ChapterTarget = {
  subject: string;
  grade: string | null;
  field: string | null;
};

export function chapterAppliesTo(chapter: Chapter, target: ChapterTarget): boolean {
  if (!chapter.active) return false;
  if (chapter.subject !== target.subject) return false;
  if (chapter.field !== "" && chapter.field !== target.field) return false;
  return true;
}

export function chapterIdsAreValid(
  ids: readonly string[],
  catalog: readonly Chapter[],
  target: ChapterTarget,
): boolean {
  for (const id of ids) {
    const chapter = catalog.find((c) => c.id === id);
    if (!chapter || !chapterAppliesTo(chapter, target)) return false;
  }
  return true;
}

/** Order-preserving dedup: first occurrence wins. */
export function dedupeChapterIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}
