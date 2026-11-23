import { describe, expect, it } from "vitest";

import { suggestLeisure, type LeisureInputs } from "./leisure";

const zero: LeisureInputs = {
  studyMinutes7d: 0,
  studyMinutes3d: 0,
  pendingHomework: 0,
  overdueHomework: 0,
};

describe("suggestLeisure", () => {
  it("leisure critical fatigue", () => {
    const threeDay = suggestLeisure({ ...zero, studyMinutes3d: 900 });
    expect(threeDay.code).toBe("critical_fatigue");

    const sevenDay = suggestLeisure({ ...zero, studyMinutes7d: 2100 });
    expect(sevenDay.code).toBe("critical_fatigue");

    expect(threeDay.actions.length).toBeGreaterThanOrEqual(2);
    expect(sevenDay.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("leisure heavy workload", () => {
    const overdue = suggestLeisure({ ...zero, overdueHomework: 3 });
    expect(overdue.code).toBe("heavy_workload");

    // Satisfies branch 2 (pending 8) and branch 3 (7d 1600): precedence wins.
    const pending = suggestLeisure({
      ...zero,
      studyMinutes7d: 1600,
      pendingHomework: 8,
    });
    expect(pending.code).toBe("heavy_workload");
  });

  it("leisure overloaded week", () => {
    const suggestion = suggestLeisure({ ...zero, studyMinutes7d: 1500 });
    expect(suggestion.code).toBe("overloaded_week");
  });

  it("leisure zero input", () => {
    const suggestion = suggestLeisure(zero);
    expect(suggestion.code).toBe("low_activity");
    expect(suggestion.actions.length).toBeGreaterThanOrEqual(2);
    for (const action of suggestion.actions) {
      expect(action.length).toBeGreaterThan(0);
    }
  });
});
