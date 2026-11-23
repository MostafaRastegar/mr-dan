import { describe, expect, it } from "vitest";

import { createNutritionLeisureFakes } from "../../../../test/fakes/nutrition-leisure";
import { GetLeisureSuggestionUseCase } from "@/modules/advising/application/leisure";

const student = { id: "s1", role: "student" as const };

describe("leisure use case", () => {
  it("leisure uses study minutes", async () => {
    const fakes = createNutritionLeisureFakes();
    const now = new Date("2026-11-23T12:00:00Z");

    await fakes.study.create({
      studentId: student.id,
      category: "study",
      durationMinutes: 600,
      startedAt: new Date("2026-11-18T09:00:00Z"),
    });
    await fakes.study.create({
      studentId: student.id,
      category: "study",
      durationMinutes: 120,
      startedAt: new Date("2026-11-22T09:00:00Z"),
    });
    await fakes.study.create({
      studentId: student.id,
      category: "break",
      durationMinutes: 50,
      startedAt: new Date("2026-11-22T10:00:00Z"),
    });
    await fakes.study.create({
      studentId: student.id,
      category: "waste",
      durationMinutes: 30,
      startedAt: new Date("2026-11-22T11:00:00Z"),
    });

    await fakes.homework.create({
      studentId: student.id,
      title: "overdue",
      priority: 2,
      deadline: new Date("2026-11-20T00:00:00Z"),
    });
    await fakes.homework.create({
      studentId: student.id,
      title: "upcoming",
      priority: 1,
      deadline: new Date("2026-11-25T00:00:00Z"),
    });

    const useCase = new GetLeisureSuggestionUseCase(fakes.study, fakes.homework);
    const result = await useCase.execute({
      actor: student,
      today: now,
      fieldOfStudy: "ریاضی فیزیک",
    });

    expect(result.inputs).toEqual({
      studyMinutes7d: 720,
      studyMinutes3d: 120,
      pendingHomework: 2,
      overdueHomework: 1,
    });
    expect(result.suggestion.code).toBe("low_activity");
    expect(result.book.id).toBe("atomic-habits");
  });
});
