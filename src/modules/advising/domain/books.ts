/**
 * Typed book catalog for the leisure page.
 *
 * Deterministic pick: catalog order is the tie-break, no hash, no
 * `Math.random` (D-6). Pure domain: type-only imports.
 */

import type { FieldOfStudy } from "./models";
import type { LeisureCode } from "./leisure";

export interface BookOffer {
  id: string;
  title: string;
  author: string;
  field: FieldOfStudy | null; // null = any field
  codes: readonly LeisureCode[]; // leisure codes this book answers
}

export const BOOKS: readonly BookOffer[] = [
  {
    id: "how-to-solve-it",
    title: "چگونه مسئله را حل کنیم",
    author: "جرج پولیا",
    field: "ریاضی فیزیک",
    codes: ["heavy_workload", "balanced"],
  },
  {
    id: "the-gene",
    title: "ژن: یک تاریخ خصوصی",
    author: "سیدهارتا موکرجی",
    field: "علوم تجربی",
    codes: ["balanced", "low_activity"],
  },
  {
    id: "the-story-of-civilization",
    title: "تاریخ تمدن",
    author: "ویل دورانت",
    field: "علوم انسانی",
    codes: ["overloaded_week", "critical_fatigue"],
  },
  {
    id: "thinking-in-systems",
    title: "تفکر سیستمی",
    author: "دانلا مدوز",
    field: "فنی حرفه‌ای",
    codes: ["heavy_workload", "low_activity"],
  },
  {
    id: "atomic-habits",
    title: "عادت‌های اتمی",
    author: "جیمز کلیر",
    field: null,
    codes: ["low_activity", "balanced"],
  },
  {
    id: "deep-work",
    title: "کار عمیق",
    author: "کال نیوپورت",
    field: null,
    codes: ["heavy_workload", "overloaded_week"],
  },
  {
    id: "why-we-sleep",
    title: "چرا می‌خوابیم",
    author: "متیو واکر",
    field: null,
    codes: ["critical_fatigue"],
  },
  {
    id: "mindset",
    title: "طرز فکر",
    author: "کارول دوک",
    field: null,
    codes: ["low_activity", "balanced"],
  },
];

export function pickBook(input: { field: FieldOfStudy | null; code: LeisureCode }): BookOffer {
  const match = BOOKS.find(
    (book) =>
      (book.field === null || book.field === input.field) && book.codes.includes(input.code),
  );
  if (match) return match;

  const fieldAgnostic = BOOKS.find((book) => book.field === null);
  return fieldAgnostic ?? BOOKS[0];
}
