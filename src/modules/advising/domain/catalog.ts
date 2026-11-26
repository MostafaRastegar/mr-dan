/**
 * Pure catalog helpers fed by repository rows.
 *
 * Subject options follow the legacy rules: an empty `fieldLabels` means every
 * field (عمومی) and an empty `gradeLabels` means every grade. Books stay
 * deterministic: rows arrive sorted by `sortOrder`, then id.
 */

import type { BookRow, SubjectRow } from "./models";
import type { LeisureCode } from "./leisure";

export interface SubjectOption {
  slug: string;
  label: string;
}

export function subjectLabelMap(
  subjects: readonly SubjectRow[],
): Record<string, string> {
  return Object.fromEntries(subjects.map((row) => [row.slug, row.label]));
}

export function labelOf(
  labels: Record<string, string>,
  slug: string,
): string {
  return labels[slug] ?? slug;
}

export function subjectOptions(
  subjects: readonly SubjectRow[],
  input: { field: string | null; grade: string | null },
): SubjectOption[] {
  return subjects
    .filter((row) => row.active)
    .filter((row) =>
      input.field === null
        ? row.fieldLabels.length === 0
        : row.fieldLabels.length === 0 || row.fieldLabels.includes(input.field),
    )
    .filter(
      (row) =>
        input.grade === null ||
        row.gradeLabels.length === 0 ||
        row.gradeLabels.includes(input.grade),
    )
    .map((row) => ({ slug: row.slug, label: row.label }));
}

export function pickBookFrom(
  books: readonly BookRow[],
  input: { field: string | null; code: LeisureCode },
): BookRow | null {
  const match = books.find(
    (book) =>
      (book.fieldLabel === null || book.fieldLabel === input.field) &&
      book.codes.includes(input.code),
  );
  if (match) return match;

  const fieldAgnostic = books.find((book) => book.fieldLabel === null);
  return fieldAgnostic ?? books[0] ?? null;
}
