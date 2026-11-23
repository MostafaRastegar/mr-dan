/**
 * Static subject catalog (D-2): no I/O, no external import, no migration,
 * no `Subject` table. `subject` stores a stable slug; the UI renders the
 * Persian label from this catalog. The catalog follows `FIELDS` exactly.
 */

import type { FieldOfStudy } from "./models";
import { FIELDS } from "./models";

export const SUBJECT_SLUGS = [
  // عمومی — all fields (متوسطه اول + دروس عمومی متوسطه دوم)
  "quran", "dini", "farsi", "arabic", "english", "riazi", "olum",
  "ejtemaei", "farhang-honar",
  // ریاضی فیزیک
  "hesaban", "hindese", "gosaste", "amar", "fizik", "shimi",
  // علوم تجربی
  "zist",
  // علوم انسانی
  "adabiat", "tarikh", "joghrafia", "eghtesad", "falsafe",
  "ravanshenasi", "ejtemaei-ensani", "riazi-ensani",
  // فنی حرفه‌ای
  "hesabdari", "bargh", "mekanik", "rayane",
] as const;

export type SubjectSlug = (typeof SUBJECT_SLUGS)[number];

export interface SubjectDefinition {
  readonly label: string;
  readonly fields: readonly FieldOfStudy[]; // empty = every field (عمومی)
}

/** Exhaustive: a missing or extra key fails `pnpm typecheck`. */
export const SUBJECTS: Readonly<Record<SubjectSlug, SubjectDefinition>> = {
  // عمومی (empty fields = all fields)
  quran: { label: "قرآن", fields: [] },
  dini: { label: "دین و زندگی", fields: [] },
  farsi: { label: "فارسی", fields: [] },
  arabic: { label: "عربی", fields: [] },
  english: { label: "زبان انگلیسی", fields: [] },
  riazi: { label: "ریاضی", fields: [] },
  olum: { label: "علوم تجربی", fields: [] },
  ejtemaei: { label: "مطالعات اجتماعی", fields: [] },
  "farhang-honar": { label: "فرهنگ و هنر", fields: [] },
  // ریاضی فیزیک
  hesaban: { label: "حسابان", fields: ["ریاضی فیزیک"] },
  hindese: { label: "هندسه", fields: ["ریاضی فیزیک"] },
  gosaste: { label: "ریاضی گسسته", fields: ["ریاضی فیزیک"] },
  amar: { label: "آمار و احتمال", fields: ["ریاضی فیزیک"] },
  fizik: { label: "فیزیک", fields: ["ریاضی فیزیک", "علوم تجربی"] },
  shimi: { label: "شیمی", fields: ["ریاضی فیزیک", "علوم تجربی"] },
  // علوم تجربی
  zist: { label: "زیست‌شناسی", fields: ["علوم تجربی"] },
  // علوم انسانی
  adabiat: { label: "ادبیات اختصاصی", fields: ["علوم انسانی"] },
  tarikh: { label: "تاریخ", fields: ["علوم انسانی"] },
  joghrafia: { label: "جغرافیا", fields: ["علوم انسانی"] },
  eghtesad: { label: "اقتصاد", fields: ["علوم انسانی"] },
  falsafe: { label: "فلسفه و منطق", fields: ["علوم انسانی"] },
  ravanshenasi: { label: "روان‌شناسی", fields: ["علوم انسانی"] },



  "ejtemaei-ensani": { label: "جامعه‌شناسی", fields: ["علوم انسانی"] },
  "riazi-ensani": { label: "ریاضی و آمار", fields: ["علوم انسانی"] },
  // فنی حرفه‌ای
  hesabdari: { label: "حسابداری", fields: ["فنی حرفه‌ای"] },
  bargh: { label: "برق", fields: ["فنی حرفه‌ای"] },
  mekanik: { label: "مکانیک", fields: ["فنی حرفه‌ای"] },
  rayane: { label: "شبکه و نرم‌افزار رایانه", fields: ["فنی حرفه‌ای"] },
} satisfies Readonly<Record<SubjectSlug, SubjectDefinition>>;

export function isSubjectSlug(value: string): value is SubjectSlug {
  return SUBJECT_SLUGS.includes(value as SubjectSlug);
}

/** Label for a known slug; an unknown string is returned unchanged (render never throws). */
export function subjectLabel(slug: string): string {
  return isSubjectSlug(slug) ? SUBJECTS[slug].label : slug;
}

/** Ordered options for the form Select: عمومی first, then the given field's own subjects. */
export function subjectsForField(
  field: string | null,
): { slug: SubjectSlug; label: string }[] {
  const known = FIELDS.find((value) => value === field) ?? null;
  const general = SUBJECT_SLUGS.filter(
    (slug) => SUBJECTS[slug].fields.length === 0,
  );
  const own = known
    ? SUBJECT_SLUGS.filter((slug) =>
        SUBJECTS[slug].fields.includes(known),
      )
    : [];
  return [...general, ...own].map((slug) => ({ slug, label: SUBJECTS[slug].label }));
}
