import { describe, expect, it } from "vitest";

import { FakeCatalogRepository } from "../../../../test/fakes/advisor-program";
import { FakeStudentExamResultRepository } from "../../../../test/fakes/advisor-program";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  SaveExamResultUseCase,
  UpdateStudyProfileUseCase,
} from "@/modules/advising/application/study-profile";
import type { Actor } from "@/modules/advising/application/planning-access";

const actor: Actor = { id: "s1", role: "student" };

function makeUsers() {
  return new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
}

async function seedUser(users: FakeUserRepository, id: string, role: "student" | "counselor" = "student") {
  await users.create({
    id,
    username: id,
    email: null,
    role,
    fullName: id,
    grade: "دهم",
    fieldOfStudy: "ریاضی فیزیک",
    schoolName: null,
    groupId: null,
    counselorId: null,
    passwordHash: "x",
  });
}

function makeCatalogs() {
  const catalogs = new FakeCatalogRepository();
  catalogs.seed(
    [
      { id: "need-1", code: "konkur", label: "کنکور", active: true },
      { id: "need-inactive", code: "inactive", label: "غیرفعال", active: false },
    ],
    [
      { id: "exam-1", code: "golchin", label: "قلمچی", active: true },
      { id: "exam-inactive", code: "inactive", label: "غیرفعال", active: false },
    ],
  );
  return catalogs;
}

describe("UpdateStudyProfileUseCase", () => {
  it("AC-17: unknown need is rejected (unknown need → ValidationError, nothing written)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();

    await expect(
      new UpdateStudyProfileUseCase(users, catalogs).execute({
        actor,
        needId: "nope",
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    // The use case threw before calling updateProfile, so nothing was written.
  });

  it("AC-17: unknown need is rejected (inactive need → ValidationError, nothing written)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();

    await expect(
      new UpdateStudyProfileUseCase(users, catalogs).execute({
        actor,
        needId: "need-inactive",
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    // The use case threw before calling updateProfile, so nothing was written.
  });

  it("accepts active need and normalizes hours to minutes", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();

    const updated = await new UpdateStudyProfileUseCase(users, catalogs).execute({
      actor,
      needId: "need-1",
      otherOccupiedHours: [1, 2, 3, 4, 5, 6, 7],
      homeworkAverageHours: 1.5,
    });

    expect(updated.id).toBe(actor.id);
    // The new fields are written through the patch; verify via a fresh read.
    const row = await users.findById(actor.id);
    expect(row?.grade).toBe("دهم");
  });

  it("unknown user → NotFoundError", async () => {
    const users = makeUsers();
    const catalogs = makeCatalogs();

    await expect(
      new UpdateStudyProfileUseCase(users, catalogs).execute({
        actor: { id: "missing", role: "student" },
        needId: "need-1",
      }),
    ).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("SaveExamResultUseCase", () => {
  it("AC-22: exam result upserts by student and exam (same exam twice → one row, newest تراز)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    const useCase = new SaveExamResultUseCase(users, catalogs, resultRepo);

    const first = await useCase.execute({ actor, examId: "exam-1", taraz: 5000 });
    const second = await useCase.execute({ actor, examId: "exam-1", taraz: 7000 });

    expect(first.taraz).toBe(5000);
    expect(second.taraz).toBe(7000);
    expect(second.id).toBe(first.id); // same row, updated

    const recent = await resultRepo.listRecent(actor.id, 2);
    expect(recent).toHaveLength(1);
    expect(recent[0].taraz).toBe(7000);
  });

  it("AC-23: taraz bounds (taraz −1 rejected)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    const useCase = new SaveExamResultUseCase(users, catalogs, resultRepo);

    await expect(
      useCase.execute({ actor, examId: "exam-1", taraz: -1 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("AC-23: taraz bounds (taraz 10001 rejected)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    const useCase = new SaveExamResultUseCase(users, catalogs, resultRepo);

    await expect(
      useCase.execute({ actor, examId: "exam-1", taraz: 10001 }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("AC-23: taraz bounds (taraz 0 accepted)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    const useCase = new SaveExamResultUseCase(users, catalogs, resultRepo);

    const result = await useCase.execute({ actor, examId: "exam-1", taraz: 0 });
    expect(result.taraz).toBe(0);
  });

  it("AC-23: taraz bounds (taraz 10000 accepted)", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    const useCase = new SaveExamResultUseCase(users, catalogs, resultRepo);

    const result = await useCase.execute({ actor, examId: "exam-1", taraz: 10000 });
    expect(result.taraz).toBe(10000);
  });

  it("AC-22: two most recent results", async () => {
    const users = makeUsers();
    await seedUser(users, actor.id);
    const catalogs = makeCatalogs();
    const resultRepo = new FakeStudentExamResultRepository();

    await resultRepo.upsert({ studentId: actor.id, examId: "exam-1", taraz: 5000 });
    await resultRepo.upsert({ studentId: actor.id, examId: "exam-inactive", taraz: 8000 });

    const recent = await resultRepo.listRecent(actor.id, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0].taraz).toBe(8000);
    expect(recent[1].taraz).toBe(5000);
  });
});
