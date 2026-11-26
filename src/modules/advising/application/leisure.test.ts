import { describe, expect, it } from "vitest";

import { createPlanningFakes } from "../../../../test/fakes/planning";
import { GetLeisureSuggestionUseCase } from "@/modules/advising/application/leisure";
import { iranDayKey, shiftDayKey, startOfIranDay } from "@/modules/advising/domain/day-key";

const student = { id: "s1", role: "student" as const };
const TODAY = new Date("2026-11-23T12:00:00Z"); // 2026-11-23 in Iran
const TODAY_KEY = iranDayKey(TODAY);

describe("leisure use case", () => {
  it("leisure reads budget rows in the last seven days", async () => {
    const fakes = createPlanningFakes();

    fakes.budget.seed(student.id, shiftDayKey(TODAY_KEY, -6), 120);
    fakes.budget.seed(student.id, TODAY_KEY, 300);
    fakes.budget.seed(student.id, shiftDayKey(TODAY_KEY, -7), 999); // outside: before
    fakes.budget.seed(student.id, shiftDayKey(TODAY_KEY, 1), 999); // outside: after

    fakes.plans.seed(student.id, shiftDayKey(TODAY_KEY, -3), "hw-1", 90);
    fakes.plans.seed(student.id, shiftDayKey(TODAY_KEY, -7), "hw-2", 555); // outside

    const result = await new GetLeisureSuggestionUseCase(
      fakes.budget,
      fakes.plans,
      fakes.homework,
      fakes.catalogs,
    ).execute({ actor: student, today: TODAY });

    expect(result.inputs.freeMinutes7d).toBe(420);
    expect(result.inputs.plannedMinutes7d).toBe(90);
    expect(result.suggestion.code).toBe("low_activity");
  });

  it("leisure ignores missing budget days", async () => {
    const fakes = createPlanningFakes();

    fakes.budget.seed(student.id, shiftDayKey(TODAY_KEY, -3), 60);
    fakes.budget.seed(student.id, shiftDayKey(TODAY_KEY, -1), 90);
    fakes.plans.seed(student.id, shiftDayKey(TODAY_KEY, -4), "hw-1", 120);

    const result = await new GetLeisureSuggestionUseCase(
      fakes.budget,
      fakes.plans,
      fakes.homework,
      fakes.catalogs,
    ).execute({ actor: student, today: TODAY });

    // Two seeded days only; the five absent days contribute 0, never an assumed 840.
    expect(result.inputs.freeMinutes7d).toBe(150);
    expect(result.inputs.plannedMinutes7d).toBe(120);
    expect(result.suggestion.code).toBe("low_activity");
  });

  it("leisure counts overdue homework by Iran day", async () => {
    const fakes = createPlanningFakes();

    const yesterdayNoon = new Date(`${shiftDayKey(TODAY_KEY, -1)}T12:00:00Z`);
    const tomorrowNoon = new Date(`${shiftDayKey(TODAY_KEY, 1)}T12:00:00Z`);
    const overdueDeadline = startOfIranDay(yesterdayNoon); // Iran midnight yesterday
    const endOfToday = new Date(startOfIranDay(tomorrowNoon).getTime() - 60_000); // 23:59 Iran today

    await fakes.homework.create({
      studentId: student.id,
      title: "overdue",
      priority: 2,
      deadline: overdueDeadline,
    });
    await fakes.homework.create({
      studentId: student.id,
      title: "due tonight",
      priority: 1,
      deadline: endOfToday,
    });

    const result = await new GetLeisureSuggestionUseCase(
      fakes.budget,
      fakes.plans,
      fakes.homework,
      fakes.catalogs,
    ).execute({ actor: student, today: TODAY });

    expect(result.inputs.pendingHomework).toBe(2);
    expect(result.inputs.overdueHomework).toBe(1);
    expect(result.suggestion.code).toBe("low_activity");
  });
});
