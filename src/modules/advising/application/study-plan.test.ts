import { describe, expect, it, vi } from "vitest";

import { FakeChapterRepository } from "../../../../test/fakes/advisor-program";
import { FakeSchoolProgramRepository } from "../../../../test/fakes/advisor-program";
import { FakeStudyPlanRepository } from "../../../../test/fakes/advisor-program";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import { FakeScheduleRepository } from "../../../../test/fakes/planning";
import { FakeWeeklyGoalRepository } from "../../../../test/fakes/weekly-goal";
import { persianDayOf, weekStartKey } from "@/modules/advising/domain/day-key";
import {
  AddStudyPlanEntryUseCase,
  GetStudentStudyPlanUseCase,
  SaveStudyPlanHeaderUseCase,
} from "@/modules/advising/application/study-plan";
import type { Actor } from "@/modules/advising/application/planning-access";

const counselor: Actor = { id: "c1", role: "counselor" };
const student: Actor = { id: "s1", role: "student" };
const otherCounselor: Actor = { id: "c2", role: "counselor" };

function makeUsers() {
  return new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
}

async function seedCounselor(users: FakeUserRepository, id: string) {
  await users.create({
    id,
    username: id,
    email: null,
    role: "counselor",
    fullName: id,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: "x",
  });
}

async function seedStudent(
  users: FakeUserRepository,
  id: string,
  counselorId: string | null = null,
  grade: string | null = "دهم",
  fieldOfStudy: string | null = "ریاضی فیزیک",
) {
  await users.create({
    id,
    username: id,
    email: null,
    role: "student",
    fullName: id,
    grade,
    fieldOfStudy,
    schoolName: null,
    groupId: null,
    counselorId,
    passwordHash: "x",
  });
}

function makeChapterCatalog() {
  const catalog = new FakeChapterRepository();
  catalog.seed([
    { id: "ch-1", subject: "riazi", field: "", grade: "دهم", number: 1, title: "فصل ۱", active: true },
    { id: "ch-2", subject: "riazi", field: "", grade: "دهم", number: 2, title: "فصل ۲", active: true },
    { id: "ch-other-subject", subject: "fizik", field: "", grade: "دهم", number: 1, title: "فصل ۱", active: true },
    { id: "ch-other-grade", subject: "riazi", field: "", grade: "یازدهم", number: 1, title: "فصل ۱", active: true },
    { id: "ch-other-field", subject: "riazi", field: "علوم تجربی", grade: "دهم", number: 1, title: "فصل ۱", active: true },
    { id: "ch-inactive", subject: "riazi", field: "", grade: "دهم", number: 9, title: "فصل ۹", active: false },
  ]);
  return catalog;
}

describe("GetStudentStudyPlanUseCase", () => {
  it("AC-19: counselor may not read another students plan (counselor cannot read another student's plan)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedCounselor(users, otherCounselor.id);
    await seedStudent(users, "s1", counselor.id);
    await seedStudent(users, "s2", otherCounselor.id);

    const plans = new FakeStudyPlanRepository();
    const school = new FakeSchoolProgramRepository();
    const schedule = new FakeScheduleRepository();
    const goals = new FakeWeeklyGoalRepository();

    const useCase = new GetStudentStudyPlanUseCase(users, plans, school, schedule, goals);

    await expect(
      useCase.execute({ actor: counselor, studentId: "s2" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("AC-21: study plan totals (testsTarget 200 + entries 900 → read model 900/200)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const school = new FakeSchoolProgramRepository();
    const schedule = new FakeScheduleRepository();
    const goals = new FakeWeeklyGoalRepository();

    await plans.upsertHeader({
      studentId: "s1",
      counselorId: counselor.id,
      testsTarget: 200,
    });
    await plans.upsertEntry({
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 300,
      testsTarget: 0,
      chapterIds: [],
      note: null,
    });
    await plans.upsertEntry({
      studentId: "s1",
      dayOfWeek: 2,
      subject: "fizik",
      minutes: 600,
      testsTarget: 0,
      chapterIds: [],
      note: null,
    });

    const useCase = new GetStudentStudyPlanUseCase(users, plans, school, schedule, goals);
    const view = await useCase.execute({ actor: counselor, studentId: "s1" });

    expect(view.goalProgress.studyMinutesTarget).toBe(900);
    expect(view.goalProgress.testsTarget).toBe(200);
    expect(view.plan!.testsTarget).toBe(200);
    expect(view.entries).toHaveLength(2);
  });

  it("no plan → 0/0 and percent 0", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const school = new FakeSchoolProgramRepository();
    const schedule = new FakeScheduleRepository();
    const goals = new FakeWeeklyGoalRepository();

    const useCase = new GetStudentStudyPlanUseCase(users, plans, school, schedule, goals);
    const view = await useCase.execute({ actor: counselor, studentId: "s1" });

    expect(view.plan).toBeNull();
    expect(view.goalProgress.studyMinutesTarget).toBe(0);
    expect(view.goalProgress.testsTarget).toBe(0);
    expect(view.goalProgress.studyPercent).toBe(0);
    expect(view.goalProgress.testsPercent).toBe(0);
  });

  it("AC-51: subject progress read model (rows + totals)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-28T12:00:00Z"));

    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const school = new FakeSchoolProgramRepository();
    const schedule = new FakeScheduleRepository();
    const goals = new FakeWeeklyGoalRepository();

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 100 });
    const dayKey = "2026-11-28";
    const weekday = persianDayOf(dayKey);
    const riazi = await plans.upsertEntry({ studentId: "s1", dayOfWeek: weekday, subject: "riazi", minutes: 300, testsTarget: 0, chapterIds: [], note: null });
    await plans.upsertEntry({ studentId: "s1", dayOfWeek: weekday, subject: "fizik", minutes: 120, testsTarget: 0, chapterIds: [], note: null });
    await goals.seed({
      id: "wg-1",
      studentId: "s1",
      weekKey: weekStartKey(dayKey),
      testsDone: 0,
      completedBlocks: [`${dayKey}:${riazi.id}`],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = new GetStudentStudyPlanUseCase(users, plans, school, schedule, goals);
    const view = await useCase.execute({ actor: counselor, studentId: "s1" });

    expect(view.rows).toEqual([
      { subject: "riazi", plannedMinutes: 300, studiedMinutes: 300, shortfallMinutes: 0, testsDone: 0, testsTarget: 0 },
      { subject: "fizik", plannedMinutes: 120, studiedMinutes: 0, shortfallMinutes: 120, testsDone: 0, testsTarget: 0 },
    ]);
    expect(view.totals).toEqual({
      plannedMinutes: 420,
      studiedMinutes: 300,
      shortfallMinutes: 120,
      testsDone: 0,
      testsTarget: 100,
    });
  });
});

describe("AddStudyPlanEntryUseCase", () => {
  it("AC-20: student may not write the study plan (student cannot write)", async () => {
    const users = makeUsers();
    await seedStudent(users, "s1", null);

    const plans = new FakeStudyPlanRepository();
    const chapters = new FakeChapterRepository();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await expect(
      useCase.execute({
        actor: student,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("AC-44: unknown chapter is rejected (unknown chapter id → ValidationError, nothing written)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = new FakeChapterRepository();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        chapterIds: ["unknown-id"],
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const plan = await plans.findForStudent("s1");
    expect(plan?.entries).toEqual([]);
  });

  it("AC-44: unknown chapter is rejected (inactive chapter id → ValidationError, nothing written)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        chapterIds: ["ch-inactive"],
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const plan = await plans.findForStudent("s1");
    expect(plan?.entries).toEqual([]);
  });

  it("AC-45: chapter must match the student subject grade and field (chapter of another subject → rejected)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        chapterIds: ["ch-other-subject"],
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("AC-45: chapter of another grade is accepted (grade is catalog metadata)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);
    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 60,
      chapterIds: ["ch-other-grade"],
    });
    expect(created.chapterIds).toEqual(["ch-other-grade"]);
  });

  it("AC-45: chapter must match the student subject grade and field (chapter of another field → rejected; field: '' accepted)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id, "دهم", "ریاضی فیزیک");

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        chapterIds: ["ch-other-field"],
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 2,
      subject: "riazi",
      minutes: 60,
      chapterIds: ["ch-1"],
    });
    expect(created.chapterIds).toEqual(["ch-1"]);
  });

  it("AC-46: chapter ids dedupe and note trims (duplicate ids deduped before write)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 60,
      chapterIds: ["ch-1", "ch-2", "ch-1"],
    });
    expect(created.chapterIds).toEqual(["ch-1", "ch-2"]);

    const plan = await plans.findForStudent("s1");
    expect(plan!.entries[0].chapterIds).toEqual(["ch-1", "ch-2"]);
  });

  it("AC-46: chapter ids dedupe and note trims (whitespace-only note → null)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 60,
      note: "   ",
    });
    expect(created.note).toBeNull();
  });

  it("AC-46: chapter ids dedupe and note trims (surrounding whitespace trimmed)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 60,
      note: "  یادداشت  ",
    });
    expect(created.note).toBe("یادداشت");
  });

  it("AC-46: chapter ids dedupe and note trims (201-char note → ValidationError)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        note: "a".repeat(201),
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const plan = await plans.findForStudent("s1");
    expect(plan?.entries).toEqual([]);
  });

  it("empty chapter list accepted", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await plans.upsertHeader({ studentId: "s1", counselorId: counselor.id, testsTarget: 300 });

    const created = await useCase.execute({
      actor: counselor,
      studentId: "s1",
      dayOfWeek: 1,
      subject: "riazi",
      minutes: 60,
    });
    expect(created.chapterIds).toEqual([]);
    expect(created.note).toBeNull();
  });

  it("SaveStudyPlanHeaderUseCase: testsTarget bounds", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();

    const useCase = new SaveStudyPlanHeaderUseCase(users, plans);

    await expect(
      useCase.execute({ actor: counselor, studentId: "s1", testsTarget: -1 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    await expect(
      useCase.execute({ actor: counselor, studentId: "s1", testsTarget: 2001 }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    const plan = await useCase.execute({ actor: counselor, studentId: "s1", testsTarget: 200 });
    expect(plan.testsTarget).toBe(200);
  });
});

describe("admin supervision of the study plan", () => {
  const admin: Actor = { id: "a1", role: "admin" };
  const operator: Actor = { id: "o1", role: "operator" };

  async function seedAdmin(users: FakeUserRepository) {
    await users.create({
      id: admin.id,
      username: admin.id,
      email: null,
      role: "admin",
      fullName: admin.id,
      grade: null,
      fieldOfStudy: null,
      schoolName: null,
      groupId: null,
      counselorId: null,
      passwordHash: "x",
    });
  }

  function makeUseCase(users: FakeUserRepository) {
    return new GetStudentStudyPlanUseCase(
      users,
      new FakeStudyPlanRepository(),
      new FakeSchoolProgramRepository(),
      new FakeScheduleRepository(),
      new FakeWeeklyGoalRepository(),
    );
  }

  it("AC-8: admin reads a student's plan read-only (canWrite:false)", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);
    await seedAdmin(users);

    const view = await makeUseCase(users).execute({
      actor: admin,
      studentId: "s1",
    });

    expect(view.canWrite).toBe(false);
    expect(view.student.grade).toBe("دهم");
  });

  it("AC-8: counselor-of-record read keeps canWrite:true", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const view = await makeUseCase(users).execute({
      actor: counselor,
      studentId: "s1",
    });

    expect(view.canWrite).toBe(true);
  });

  it("AC-8: student reads own plan read-only; operator may not read", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const own = await makeUseCase(users).execute({
      actor: student,
      studentId: "s1",
    });
    expect(own.canWrite).toBe(false);

    await expect(
      makeUseCase(users).execute({ actor: operator, studentId: "s1" }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("AC-8: admin study-plan writes are forbidden", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);
    await seedAdmin(users);

    const plans = new FakeStudyPlanRepository();
    const header = new SaveStudyPlanHeaderUseCase(users, plans);
    const addEntry = new AddStudyPlanEntryUseCase(
      users,
      plans,
      new FakeChapterRepository(),
    );

    await expect(
      header.execute({ actor: admin, studentId: "s1", testsTarget: 100 }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      addEntry.execute({
        actor: admin,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
