import { describe, expect, it } from "vitest";

import {
  createPlanningFakes,
} from "../../../../test/fakes/planning";
import { FakeUserRepository } from "../../../../test/fakes/advising";
import {
  GetStudyAnalysisUseCase,
  RecordStudySessionUseCase,
} from "@/modules/advising/application/study";
import type { Actor } from "@/modules/advising/application/planning-access";

const student = { id: "s1", role: "student" as const };
const counselor = { id: "c1", role: "counselor" as const };
const otherCounselor = { id: "c2", role: "counselor" as const };

function actorOf(user: { id: string; role: "student" | "counselor" }): Actor {
  return { id: user.id, role: user.role };
}

function makeUsers() {
  return new FakeUserRepository({ groupNames: new Map(), groupCounts: new Map() });
}

async function seedUser(users: FakeUserRepository, id: string, role: "student" | "counselor", counselorId: string | null = null) {
  await users.create({
    id,
    username: id,
    email: null,
    role,
    fullName: id,
    grade: null,
    fieldOfStudy: null,
    schoolName: null,
    groupId: null,
    counselorId,
    passwordHash: "x",
  });
}

describe("study use cases", () => {
  it("record study session", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const record = new RecordStudySessionUseCase(users, fakes.study);

    const startedAt = new Date("2026-11-23T08:00:00Z");
    const session = await record.execute({
      actor: actorOf(student),
      studentId: student.id,
      category: "study",
      subject: "riazi",
      durationMinutes: 25,
      focusLevel: 4,
      startedAt,
    });

    expect(session.category).toBe("study");
    expect(session.subject).toBe("riazi");
    expect(session.durationMinutes).toBe(25);
    expect(session.focusLevel).toBe(4);
    expect(fakes.study.writes).toBe(1);
  });

  it("focusLevel nulled for break/waste", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const record = new RecordStudySessionUseCase(users, fakes.study);

    const startedAt = new Date("2026-11-23T08:00:00Z");
    const session = await record.execute({
      actor: actorOf(student),
      studentId: student.id,
      category: "break",
      subject: null,
      durationMinutes: 5,
      focusLevel: 5,
      startedAt,
    });

    expect(session.focusLevel).toBeNull();

    const waste = await record.execute({
      actor: actorOf(student),
      studentId: student.id,
      category: "waste",
      subject: null,
      durationMinutes: 10,
      focusLevel: 5,
      startedAt,
    });

    expect(waste.focusLevel).toBeNull();
  });

  it("duration bounds", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const record = new RecordStudySessionUseCase(users, fakes.study);

    await expect(
      record.execute({
        actor: actorOf(student),
        studentId: student.id,
        category: "study",
        subject: null,
        durationMinutes: 0,
        focusLevel: null,
        startedAt: new Date("2026-11-23T08:00:00Z"),
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    await expect(
      record.execute({
        actor: actorOf(student),
        studentId: student.id,
        category: "study",
        subject: null,
        durationMinutes: 1441,
        focusLevel: null,
        startedAt: new Date("2026-11-23T08:00:00Z"),
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    expect(fakes.study.writes).toBe(0);
  });

  it("future session", async () => {
    const users = makeUsers();
    await seedUser(users, student.id, "student");
    const fakes = createPlanningFakes();
    const record = new RecordStudySessionUseCase(users, fakes.study);

    const now = new Date("2026-11-23T10:00:00Z");
    const farFuture = new Date(now.getTime() + 10 * 60 * 1000); // 10 min ahead
    await expect(
      record.execute({
        actor: actorOf(student),
        studentId: student.id,
        category: "study",
        subject: null,
        durationMinutes: 25,
        focusLevel: null,
        startedAt: farFuture,
        now,
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });

    expect(fakes.study.writes).toBe(0);
  });

  it("counselor reads own student's analysis", async () => {
    const users = makeUsers();
    await seedUser(users, counselor.id, "counselor");
    await seedUser(users, student.id, "student", counselor.id);
    const fakes = createPlanningFakes();
    const studyRepo = fakes.study;
    const record = new RecordStudySessionUseCase(users, studyRepo);
    const analysis = new GetStudyAnalysisUseCase(users, studyRepo);

    await record.execute({
      actor: actorOf(student),
      studentId: student.id,
      category: "study",
      subject: null,
      durationMinutes: 25,
      focusLevel: 4,
      startedAt: new Date("2026-11-23T08:00:00Z"),
    });

    const result = await analysis.execute({
      actor: actorOf(counselor),
      studentId: student.id,
      days: 7,
    });

    expect(result.totalStudyMinutes).toBe(25);
    expect(result.today.studyMinutes).toBe(25);
  });

  it("foreign → 403", async () => {
    const users = makeUsers();
    await seedUser(users, counselor.id, "counselor");
    await seedUser(users, otherCounselor.id, "counselor");
    await seedUser(users, student.id, "student", otherCounselor.id);
    const fakes = createPlanningFakes();
    const analysis = new GetStudyAnalysisUseCase(users, fakes.study);

    await expect(
      analysis.execute({ actor: actorOf(counselor), studentId: student.id }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
});
