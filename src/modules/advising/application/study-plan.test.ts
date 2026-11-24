import { describe, expect, it } from "vitest";

import { FakeChapterRepository } from "../../../../test/fakes/advisor-program";
import { FakeSchoolProgramRepository } from "../../../../test/fakes/advisor-program";
import { FakeStudyPlanRepository } from "../../../../test/fakes/advisor-program";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import { FakeScheduleRepository } from "../../../../test/fakes/planning";
import { FakeWeeklyGoalRepository } from "../../../../test/fakes/weekly-goal";
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
  it("AC-19: counselor cannot read another student's plan", async () => {
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

  it("AC-21: testsTarget 200 + entries 900 → read model 900/200", async () => {
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
      chapterIds: [],
      note: null,
    });
    await plans.upsertEntry({
      studentId: "s1",
      dayOfWeek: 2,
      subject: "fizik",
      minutes: 600,
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
});

describe("AddStudyPlanEntryUseCase", () => {
  it("AC-20: student cannot write", async () => {
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

  it("AC-44: unknown chapter id → ValidationError, nothing written", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = new FakeChapterRepository();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

    await expect(
      useCase.execute({
        actor: counselor,
        studentId: "s1",
        dayOfWeek: 1,
        subject: "riazi",
        minutes: 60,
        chapterIds: ["unknown-id"],
      }),
    ).rejects.toMatchObject({ code: "validation_error" });

    const plan = await plans.findForStudent("s1");
    expect(plan?.entries).toEqual([]);
  });

  it("AC-44: inactive chapter id → ValidationError, nothing written", async () => {
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
        chapterIds: ["ch-inactive"],
      }),
    ).rejects.toMatchObject({ code: "validation_error" });

    const plan = await plans.findForStudent("s1");
    expect(plan?.entries).toEqual([]);
  });

  it("AC-45: chapter of another subject → rejected", async () => {
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
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("AC-45: chapter of another grade → rejected", async () => {
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
        chapterIds: ["ch-other-grade"],
      }),
    ).rejects.toMatchObject({ code: "validation_error" });
  });

  it("AC-45: chapter of another field → rejected; field: '' accepted", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id, "دهم", "ریاضی فیزیک");

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
        chapterIds: ["ch-other-field"],
      }),
    ).rejects.toMatchObject({ code: "validation_error" });

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

  it("AC-46: duplicate ids deduped before write", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

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

  it("AC-46: whitespace-only note → null", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

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

  it("AC-46: surrounding whitespace trimmed", async () => {
    const users = makeUsers();
    await seedCounselor(users, counselor.id);
    await seedStudent(users, "s1", counselor.id);

    const plans = new FakeStudyPlanRepository();
    const chapters = makeChapterCatalog();

    const useCase = new AddStudyPlanEntryUseCase(users, plans, chapters);

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

  it("AC-46: 201-char note → ValidationError", async () => {
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
        note: "a".repeat(201),
      }),
    ).rejects.toMatchObject({ code: "validation_error" });

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
    ).rejects.toMatchObject({ code: "validation_error" });
    await expect(
      useCase.execute({ actor: counselor, studentId: "s1", testsTarget: 2001 }),
    ).rejects.toMatchObject({ code: "validation_error" });

    const plan = await useCase.execute({ actor: counselor, studentId: "s1", testsTarget: 200 });
    expect(plan.testsTarget).toBe(200);
  });
});
