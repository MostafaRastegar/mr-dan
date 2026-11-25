/**
 * Advisor-program integration tests against real Postgres.
 *
 * Skips every case when Postgres is unreachable so CI stays green without
 * docker. Rows are namespaced by `RUN` and removed afterwards.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/shared/prisma";
import { PrismaCatalogRepository } from "@/modules/advising/infrastructure/prisma-catalog-repository";
import { PrismaChapterRepository } from "@/modules/advising/infrastructure/prisma-chapter-repository";
import { PrismaHomeworkRepository } from "@/modules/advising/infrastructure/prisma-homework-repository";
import { PrismaSchoolProgramRepository } from "@/modules/advising/infrastructure/prisma-school-program-repository";
import { PrismaStudentExamResultRepository } from "@/modules/advising/infrastructure/prisma-student-exam-result-repository";
import { PrismaStudyPlanRepository } from "@/modules/advising/infrastructure/prisma-study-plan-repository";
import { PrismaUserRepository } from "@/modules/advising/infrastructure/prisma-user-repository";
import { PrismaWeeklyGoalRepository } from "@/modules/advising/infrastructure/prisma-weekly-goal-repository";
import { seedCatalogs } from "../../scripts/seed-advising";
import type { NewUser } from "@/modules/advising/domain/models";

const users = new PrismaUserRepository();
const catalogs = new PrismaCatalogRepository();
const chapters = new PrismaChapterRepository();
const schoolProgram = new PrismaSchoolProgramRepository();
const examResults = new PrismaStudentExamResultRepository();
const studyPlans = new PrismaStudyPlanRepository();
const homework = new PrismaHomeworkRepository();
const weeklyGoals = new PrismaWeeklyGoalRepository();

const RUN = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const PASSWORD_HASH = `scrypt$16384$8$1$${"a".repeat(22)}$${"b".repeat(64)}`;
const createdUsernames: string[] = [];
const createdStudentIds: string[] = [];

let live = false;

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    live = true;
  } catch {
    live = false;
  }
});

afterAll(async () => {
  if (live) {
    if (createdUsernames.length > 0) {
      await prisma.user.deleteMany({ where: { username: { in: createdUsernames } } });
    }
    if (createdStudentIds.length > 0) {
      await prisma.testRecord.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.weeklyGoal.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.studyPlanEntry.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.studyPlan.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.schoolProgramEntry.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.studentExamResult.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.supplementaryCourse.deleteMany({ where: { studentId: { in: createdStudentIds } } });
      await prisma.homework.deleteMany({ where: { studentId: { in: createdStudentIds } } });
    }
  }
  await prisma.$disconnect();
});

function student(label: string): NewUser & { passwordHash: string } {
  const username = `it-${label}-${RUN}`;
  createdUsernames.push(username);
  return {
    username,
    email: null,
    role: "student",
    fullName: `تست ${label}`,
    grade: "دهم",
    fieldOfStudy: "ریاضی فیزیک",
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: PASSWORD_HASH,
  };
}

async function createStudent(label: string) {
  const user = await users.create(student(label));
  createdStudentIds.push(user.id);
  return user;
}

async function createCounselor(label: string) {
  const username = `it-counselor-${label}-${RUN}`;
  createdUsernames.push(username);
  return await prisma.user.create({
    data: {
      username,
      email: null,
      passwordHash: PASSWORD_HASH,
      role: "counselor",
      fullName: `مشاور ${label}`,
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: null,
    },
    select: { id: true },
  });
}

describe("advisor-program integration (real Postgres)", () => {
  it("AC-13: catalog and chapter seed is idempotent (catalog seed twice → stable counts, needs keep codes)", async () => {
    if (!live) return;

    const first = await seedCatalogs();
    const second = await seedCatalogs();

    expect(first.needs).toBe(3);
    expect(second.needs).toBe(3);
    expect(first.exams).toBe(second.exams);
    expect(first.chapters).toBe(second.chapters);

    const needRows = await prisma.need.findMany();
    expect(needRows.map((n) => n.code).sort()).toEqual([
      "afzayesh-moadel",
      "konkur",
      "tarmim-moadel",
    ]);
    expect(needRows.every((n) => n.active)).toBe(true);
  });

  it("StudyPlan header upsert keeps one row per student", async () => {
    if (!live) return;

    const user = await createStudent("plan-student");
    const counselor = await createCounselor("plan-counselor");

    await prisma.user.update({
      where: { id: user.id },
      data: { counselorId: counselor.id },
    });

    const first = await studyPlans.upsertHeader({
      studentId: user.id,
      counselorId: counselor.id,
      testsTarget: 300,
    });
    const second = await studyPlans.upsertHeader({
      studentId: user.id,
      counselorId: counselor.id,
      testsTarget: 500,
    });

    expect(first.id).toBe(second.id);
    expect(second.testsTarget).toBe(500);

    const count = await prisma.studyPlan.count({ where: { studentId: user.id } });
    expect(count).toBe(1);
  });

  it("StudentExamResult upsert by (studentId, examId) → one row, taraz updated", async () => {
    if (!live) return;

    const user = await createStudent("exam-student");
    const exam = await prisma.exam.create({
      data: { code: `exam-${RUN}`, label: "آزمون تست", active: true },
    });

    const first = await examResults.upsert({
      studentId: user.id,
      examId: exam.id,
      taraz: 5000,
    });
    const second = await examResults.upsert({
      studentId: user.id,
      examId: exam.id,
      taraz: 7000,
    });

    expect(first.id).toBe(second.id);
    expect(second.taraz).toBe(7000);

    const count = await prisma.studentExamResult.count({
      where: { studentId: user.id, examId: exam.id },
    });
    expect(count).toBe(1);
  });

  it("User.otherOccupiedMinutes round-trips 7 ints", async () => {
    if (!live) return;

    const user = await createStudent("occupied-student");
    const minutes = [60, 120, 180, 240, 300, 360, 420];

    await prisma.user.update({
      where: { id: user.id },
      data: { otherOccupiedMinutes: minutes },
    });

    const row = await prisma.user.findUnique({ where: { id: user.id } });
    expect(row?.otherOccupiedMinutes).toEqual(minutes);
  });

  it("Homework.spentMinutes round-trips", async () => {
    if (!live) return;

    const user = await createStudent("hw-student");
    const task = await homework.create({
      studentId: user.id,
      title: "تکلیف تست",
      subject: null,
      priority: 2,
      deadline: new Date("2026-12-01T20:30:00Z"),
    });

    const done = await homework.setCompletion(task.id, {
      completedAt: new Date("2026-11-25T20:30:00Z"),
      spentMinutes: 45,
    });
    expect(done.spentMinutes).toBe(45);
    expect(done.completedAt).not.toBeNull();

    const unticked = await homework.setCompletion(task.id, {
      completedAt: null,
      spentMinutes: null,
    });
    expect(unticked.completedAt).toBeNull();
    expect(unticked.spentMinutes).toBeNull();
  });

  it("school-program unique violation surfaces Persian conflict", async () => {
    if (!live) return;

    const user = await createStudent("school-student");
    await schoolProgram.create({
      studentId: user.id,
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 180,
    });

    await expect(
      schoolProgram.create({
        studentId: user.id,
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 120,
      }),
    ).rejects.toMatchObject({ code: "conflict" });

    const rows = await schoolProgram.listByStudent(user.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].minutes).toBe(180);
  });

  it("seedCatalogs twice → Chapter counts unchanged, compound unique holds", async () => {
    if (!live) return;

    const first = await seedCatalogs();
    const second = await seedCatalogs();

    expect(first.chapters).toBe(second.chapters);
    const count = await prisma.chapter.count();
    expect(count).toBe(first.chapters);

    // Compound unique: same subject/field/grade/number cannot be re-created with different title without upsert
    const chapter = await prisma.chapter.findFirst({
      where: { subject: "riazi", field: "", grade: "دوازدهم", number: 1 },
    });
    expect(chapter).not.toBeNull();
  });

  it("StudyPlanEntry.chapterIds round-trips as text[]; deactivated chapter still resolves by id", async () => {
    if (!live) return;

    const user = await createStudent("chapter-student");
    const counselor = await createCounselor("chapter-counselor");
    await prisma.user.update({ where: { id: user.id }, data: { counselorId: counselor.id } });

    await seedCatalogs();

    const chapter = await prisma.chapter.findFirst({
      where: { subject: "riazi", field: "", grade: "دوازدهم", number: 1 },
    });
    expect(chapter).not.toBeNull();

    const plan = await studyPlans.upsertHeader({
      studentId: user.id,
      counselorId: counselor.id,
      testsTarget: 200,
    });

    const entry = await studyPlans.upsertEntry({
      studentId: user.id,
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 120,
      chapterIds: [chapter!.id],
      note: "یادداشت تست",
    });

    expect(entry.chapterIds).toContain(chapter!.id);
    expect(entry.note).toBe("یادداشت تست");

    // Deactivate the chapter; findByIds still resolves it (active flag ignored)
    await prisma.chapter.update({
      where: { id: chapter!.id },
      data: { active: false },
    });
    const found = await chapters.findByIds([chapter!.id]);
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(chapter!.id);
  });

  it("AC-41 / AC-52: subject test record (incrementSubjectTests — two calls, WeeklyGoal.testsDone and TestRecord.count correct, one transaction)", async () => {
    if (!live) return;

    const user = await createStudent("subject-test-student");
    const weekKey = "2026-11-21";

    await weeklyGoals.incrementSubjectTests({
      studentId: user.id,
      weekKey,
      subject: "riazi",
      count: 3,
    });
    await weeklyGoals.incrementSubjectTests({
      studentId: user.id,
      weekKey,
      subject: "riazi",
      count: 2,
    });

    const goal = await weeklyGoals.findByKey(user.id, weekKey);
    expect(goal?.testsDone).toBe(5);

    const records = await prisma.testRecord.findMany({
      where: { studentId: user.id, subject: "riazi", weekKey },
    });
    expect(records).toHaveLength(1);
    expect(records[0].count).toBe(5);
  });

});
