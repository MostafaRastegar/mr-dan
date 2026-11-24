import { describe, expect, it } from "vitest";

import { goalProgress, type GoalProgress } from "./weekly-goal";
import type { WeeklyGoal } from "./models";

describe("goalProgress", () => {
  const baseGoal: WeeklyGoal = {
    id: "g1",
    studentId: "s1",
    weekKey: "2026-11-21",
    testsDone: 0,
    completedBlocks: [],
    createdAt: new Date("2026-11-23T00:00:00Z"),
    updatedAt: new Date("2026-11-23T00:00:00Z"),
  };

  it("empty goal returns zero progress with default targets", () => {
    const result = goalProgress(null, { studyMinutesTarget: 0, testsTarget: 0 });

    expect(result.studyMinutes).toBe(0);
    expect(result.testsDone).toBe(0);
    expect(result.studyMinutesTarget).toBe(0);
    expect(result.testsTarget).toBe(0);
    expect(result.studyPercent).toBe(0);
    expect(result.testsPercent).toBe(0);
  });

  it("sums completed block minutes and clamps percents at 100", () => {
    const goal: WeeklyGoal = {
      ...baseGoal,
      completedBlocks: [
        "2026-11-21:480:50",
        "2026-11-21:540:50",
        "2026-11-22:480:50",
      ],
      testsDone: 350,
    };

    const result = goalProgress(goal, {
      studyMinutesTarget: 1500,
      testsTarget: 300,
    });

    expect(result.studyMinutes).toBe(150);
    expect(result.studyPercent).toBe(10);
    expect(result.testsDone).toBe(350);
    expect(result.testsPercent).toBe(100); // 350/300 clamped at 100
    expect(result.testsTarget).toBe(300);
  });

  it("ignores malformed block keys", () => {
    const goal: WeeklyGoal = {
      ...baseGoal,
      completedBlocks: ["not-a-key", "2026-11-21:480:50"],
    };

    expect(
      goalProgress(goal, { studyMinutesTarget: 0, testsTarget: 0 }).studyMinutes,
    ).toBe(50);
  });

  it("goalProgress returns GoalProgress shape regardless of null goal", () => {
    const result: GoalProgress = goalProgress(null, {
      studyMinutesTarget: 0,
      testsTarget: 0,
    });

    expect(typeof result.studyMinutes).toBe("number");
    expect(typeof result.studyPercent).toBe("number");
  });
});
