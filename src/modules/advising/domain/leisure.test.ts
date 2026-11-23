import { describe, expect, it } from "vitest";

import { suggestLeisure, type LeisureInputs } from "./leisure";

const zero: LeisureInputs = {
  plannedMinutes7d: 0,
  freeMinutes7d: 0,
  pendingHomework: 0,
  overdueHomework: 0,
};

describe("suggestLeisure", () => {
  it("leisure critical fatigue at ninety percent", () => {
    const suggestion = suggestLeisure({
      ...zero,
      plannedMinutes7d: 1080,
      freeMinutes7d: 1200,
    });
    expect(suggestion.code).toBe("critical_fatigue");
    expect(suggestion.actions.length).toBeGreaterThanOrEqual(2);
  });

  it("leisure heavy workload beats utilization", () => {
    // 900/1200 = 0.75 would be overloaded_week; the backlog branch comes first.
    const heavy = suggestLeisure({
      ...zero,
      plannedMinutes7d: 900,
      freeMinutes7d: 1200,
      overdueHomework: 3,
    });
    expect(heavy.code).toBe("heavy_workload");

    // Both critical and heavy hold; branch order puts critical first.
    const both = suggestLeisure({
      ...zero,
      plannedMinutes7d: 1080,
      freeMinutes7d: 1200,
      pendingHomework: 8,
    });
    expect(both.code).toBe("critical_fatigue");
  });

  it("leisure overloaded week at seventy-five percent", () => {
    const suggestion = suggestLeisure({
      ...zero,
      plannedMinutes7d: 900,
      freeMinutes7d: 1100,
    });
    expect(suggestion.code).toBe("overloaded_week");
  });

  it("leisure balanced week in the middle band", () => {
    const suggestion = suggestLeisure({
      ...zero,
      plannedMinutes7d: 300,
      freeMinutes7d: 600,
    });
    expect(suggestion.code).toBe("balanced");
  });

  it("leisure zero budget means low activity", () => {
    expect(suggestLeisure(zero).code).toBe("low_activity");

    const smallWeek = suggestLeisure({
      ...zero,
      plannedMinutes7d: 120,
      freeMinutes7d: 840,
    });
    expect(smallWeek.code).toBe("low_activity");
    expect(smallWeek.actions.length).toBeGreaterThanOrEqual(2);
    for (const action of smallWeek.actions) {
      expect(action.length).toBeGreaterThan(0);
    }
  });
});
