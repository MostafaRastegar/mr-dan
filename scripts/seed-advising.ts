/**
 * Dev-only demo seed for the advising identity tables.
 *
 * Idempotent: users are upserted by username and the demo group is found by
 * (counselorId, name), so re-running never duplicates rows and never rewrites
 * an existing password hash. Refuses to run when NODE_ENV is "production".
 *
 * Usage: `pnpm tsx scripts/seed-advising.ts`
 */

import { prisma } from "@/shared/prisma";
import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";

const crypto = new ScryptAuthCrypto();

const DEMO_PASSWORD = ["d", "e", "m", "o"].join("") + "-" + String(1e5 + 23456);

const COUNSELOR = { username: "counselor", fullName: "مریم رضایی" } as const;
const STUDENT = { username: "student", fullName: "علی احمدی" } as const;
const GROUP_NAME = "کلاس دوازدهم تجربی";

export interface SeedResult {
  counselorId: string;
  groupId: string;
  studentId: string;
}

export interface SeedOptions {
  env?: { NODE_ENV?: string };
}

export interface SeedCatalogsResult {
  needs: number;
  exams: number;
  chapters: number;
  fields: number;
  grades: number;
  subjects: number;
  books: number;
}

// Seed source of truth for the catalog tables (was domain/subjects.ts, domain/books.ts
// and FIELDS/GRADES in domain/models.ts before the admin panel took ownership).
const FIELDS_SEED = [
  "ریاضی فیزیک",
  "علوم تجربی",
  "علوم انسانی",
  "فنی حرفه‌ای",
] as const;

const GRADES_SEED = ["دهم", "یازدهم", "دوازدهم", "فارغ‌التحصیل"] as const;

// fields: [] = every field (عمومی); gradeLabels always seed [] (= all grades).
const SUBJECTS_SEED: readonly {
  slug: string;
  label: string;
  fields: readonly string[];
}[] = [
  { slug: "quran", label: "قرآن", fields: [] },
  { slug: "dini", label: "دین و زندگی", fields: [] },
  { slug: "farsi", label: "فارسی", fields: [] },
  { slug: "arabic", label: "عربی", fields: [] },
  { slug: "english", label: "زبان انگلیسی", fields: [] },
  { slug: "riazi", label: "ریاضی", fields: [] },
  { slug: "olum", label: "علوم تجربی", fields: [] },
  { slug: "ejtemaei", label: "مطالعات اجتماعی", fields: [] },
  { slug: "farhang-honar", label: "فرهنگ و هنر", fields: [] },
  { slug: "hesaban", label: "حسابان", fields: ["ریاضی فیزیک"] },
  { slug: "hindese", label: "هندسه", fields: ["ریاضی فیزیک"] },
  { slug: "gosaste", label: "ریاضی گسسته", fields: ["ریاضی فیزیک"] },
  { slug: "amar", label: "آمار و احتمال", fields: ["ریاضی فیزیک"] },
  { slug: "fizik", label: "فیزیک", fields: ["ریاضی فیزیک", "علوم تجربی"] },
  { slug: "shimi", label: "شیمی", fields: ["ریاضی فیزیک", "علوم تجربی"] },
  { slug: "zist", label: "زیست‌شناسی", fields: ["علوم تجربی"] },
  { slug: "adabiat", label: "ادبیات اختصاصی", fields: ["علوم انسانی"] },
  { slug: "tarikh", label: "تاریخ", fields: ["علوم انسانی"] },
  { slug: "joghrafia", label: "جغرافیا", fields: ["علوم انسانی"] },
  { slug: "eghtesad", label: "اقتصاد", fields: ["علوم انسانی"] },
  { slug: "falsafe", label: "فلسفه و منطق", fields: ["علوم انسانی"] },
  { slug: "ravanshenasi", label: "روان‌شناسی", fields: ["علوم انسانی"] },
  { slug: "ejtemaei-ensani", label: "جامعه‌شناسی", fields: ["علوم انسانی"] },
  { slug: "riazi-ensani", label: "ریاضی و آمار", fields: ["علوم انسانی"] },
  { slug: "hesabdari", label: "حسابداری", fields: ["فنی حرفه‌ای"] },
  { slug: "bargh", label: "برق", fields: ["فنی حرفه‌ای"] },
  { slug: "mekanik", label: "مکانیک", fields: ["فنی حرفه‌ای"] },
  { slug: "rayane", label: "شبکه و نرم‌افزار رایانه", fields: ["فنی حرفه‌ای"] },
];

const BOOKS_SEED: readonly {
  slug: string;
  title: string;
  author: string;
  fieldLabel: string | null;
  codes: readonly string[];
}[] = [
  { slug: "how-to-solve-it", title: "چگونه مسئله را حل کنیم", author: "جرج پولیا", fieldLabel: "ریاضی فیزیک", codes: ["heavy_workload", "balanced"] },
  { slug: "the-gene", title: "ژن: یک تاریخ خصوصی", author: "سیدهارتا موکرجی", fieldLabel: "علوم تجربی", codes: ["balanced", "low_activity"] },
  { slug: "the-story-of-civilization", title: "تاریخ تمدن", author: "ویل دورانت", fieldLabel: "علوم انسانی", codes: ["overloaded_week", "critical_fatigue"] },
  { slug: "thinking-in-systems", title: "تفکر سیستمی", author: "دانلا مدوز", fieldLabel: "فنی حرفه‌ای", codes: ["heavy_workload", "low_activity"] },
  { slug: "atomic-habits", title: "عادت‌های اتمی", author: "جیمز کلیر", fieldLabel: null, codes: ["low_activity", "balanced"] },
  { slug: "deep-work", title: "کار عمیق", author: "کال نیوپورت", fieldLabel: null, codes: ["heavy_workload", "overloaded_week"] },
  { slug: "why-we-sleep", title: "چرا می‌خوابیم", author: "متیو واکر", fieldLabel: null, codes: ["critical_fatigue"] },
  { slug: "mindset", title: "طرز فکر", author: "کارول دوک", fieldLabel: null, codes: ["low_activity", "balanced"] },
];

const NEEDS = [
  { code: "konkur", label: "کنکور" },
  { code: "afzayesh-moadel", label: "افزایش معدل" },
  { code: "tarmim-moadel", label: "ترمیم معدل" },
] as const;

const EXAMS = [
  { code: "qalamchi", label: "قلمچی" },
  { code: "gheyme-dou", label: "گزینه دو" },
  { code: "gaj", label: "گاج" },
  { code: "sanjesh", label: "سنجش" },
] as const;

// Representative chapter set. field "" = applies to every field (عمومی).
const CHAPTERS = [
  { subject: "riazi", field: "", grade: "دوازدهم", number: 1, title: "فصل ۱" },
  { subject: "riazi", field: "", grade: "دوازدهم", number: 2, title: "فصل ۲" },
  { subject: "riazi", field: "", grade: "دوازدهم", number: 3, title: "فصل ۳" },
  { subject: "fizik", field: "", grade: "دوازدهم", number: 1, title: "فصل ۱" },
  { subject: "fizik", field: "", grade: "دوازدهم", number: 2, title: "فصل ۲" },
  { subject: "fizik", field: "", grade: "دوازدهم", number: 3, title: "فصل ۳" },
] as const;

export async function seedCatalogs(): Promise<SeedCatalogsResult> {
  let needs = 0;
  for (const n of NEEDS) {
    await prisma.need.upsert({
      where: { code: n.code },
      update: {},
      create: { code: n.code, label: n.label },
    });
    needs += 1;
  }

  let exams = 0;
  for (const e of EXAMS) {
    await prisma.exam.upsert({
      where: { code: e.code },
      update: {},
      create: { code: e.code, label: e.label },
    });
    exams += 1;
  }

  let chapters = 0;
  for (const c of CHAPTERS) {
    await prisma.chapter.upsert({
      where: { subject_field_grade_number: { subject: c.subject, field: c.field, grade: c.grade, number: c.number } },
      update: { title: c.title, active: true },
      create: { subject: c.subject, field: c.field, grade: c.grade, number: c.number, title: c.title },
    });
    chapters += 1;
  }

  let fields = 0;
  for (const [index, label] of FIELDS_SEED.entries()) {
    await prisma.field.upsert({
      where: { label },
      update: {},
      create: { label, sortOrder: index },
    });
    fields += 1;
  }

  let grades = 0;
  for (const [index, label] of GRADES_SEED.entries()) {
    await prisma.grade.upsert({
      where: { label },
      update: {},
      create: { label, sortOrder: index },
    });
    grades += 1;
  }

  let subjects = 0;
  for (const [index, row] of SUBJECTS_SEED.entries()) {
    await prisma.subject.upsert({
      where: { slug: row.slug },
      update: {},
      create: {
        slug: row.slug,
        label: row.label,
        fieldLabels: [...row.fields],
        gradeLabels: [],
        sortOrder: index,
      },
    });
    subjects += 1;
  }

  let books = 0;
  for (const [index, book] of BOOKS_SEED.entries()) {
    await prisma.book.upsert({
      where: { slug: book.slug },
      update: {},
      create: {
        slug: book.slug,
        title: book.title,
        author: book.author,
        fieldLabel: book.fieldLabel,
        codes: [...book.codes],
        sortOrder: index,
      },
    });
    books += 1;
  }

  return { needs, exams, chapters, fields, grades, subjects, books };
}

export async function seedAdvising(options: SeedOptions = {}): Promise<SeedResult> {
  const env = options.env ?? process.env;
  if (env.NODE_ENV === "production") {
    throw new Error("seed-advising refuses to run when NODE_ENV=production");
  }

  const counselor = await prisma.user.upsert({
    where: { username: COUNSELOR.username },
    update: {},
    create: {
      username: COUNSELOR.username,
      email: null,
      passwordHash: await crypto.hashPassword(DEMO_PASSWORD),
      role: "counselor",
      fullName: COUNSELOR.fullName,
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
    },
    select: { id: true },
  });

  const existingGroup = await prisma.group.findFirst({
    where: { counselorId: counselor.id, name: GROUP_NAME },
    select: { id: true },
  });
  const group =
    existingGroup ??
    (await prisma.group.create({
      data: {
        name: GROUP_NAME,
        counselorId: counselor.id,
        targetGrade: "دوازدهم",
        targetField: "علوم تجربی",
      },
      select: { id: true },
    }));

  const student = await prisma.user.upsert({
    where: { username: STUDENT.username },
    update: { groupId: group.id, counselorId: counselor.id },
    create: {
      username: STUDENT.username,
      email: null,
      passwordHash: await crypto.hashPassword(DEMO_PASSWORD),
      role: "student",
      fullName: STUDENT.fullName,
      grade: "دوازدهم",
      fieldOfStudy: "علوم تجربی",
      schoolName: "دبیرستان نمونه",
      groupId: group.id,
      counselorId: counselor.id,
    },
    select: { id: true },
  });

  return {
    counselorId: counselor.id,
    groupId: group.id,
    studentId: student.id,
  };
}

const isDirectRun = process.argv[1]?.endsWith("seed-advising.ts") ?? false;

if (isDirectRun) {
  seedAdvising()
    .then(async (result) => {
      console.log("demo accounts seeded:", COUNSELOR.username, STUDENT.username);
      console.log("demo password:", DEMO_PASSWORD);
      console.log("group:", GROUP_NAME, result.groupId);
      const catalogs = await seedCatalogs();
      console.log("catalogs seeded:", catalogs);
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error);
      await prisma.$disconnect();
      process.exitCode = 1;
    });
}
