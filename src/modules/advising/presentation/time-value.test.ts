import { describe, expect, it } from "vitest";

import { dateToDayKey, durationToMinutes } from "./time-value";

describe("time value", () => {
  it("picker value becomes hh:mm", () => {
    expect(durationToMinutes({ hour: () => 8, minute: () => 30 })).toBe(510);
    expect(durationToMinutes({ hour: () => 0, minute: () => 0 })).toBe(0);
    expect(durationToMinutes(null)).toBeNull();
  });

  it("picker value becomes a day key", () => {
    expect(dateToDayKey({ format: () => "2026-12-01" })).toBe("2026-12-01");
    expect(dateToDayKey({ format: () => "2026-02-30" })).toBeNull();
  });

  it("picker value rejects a non formatter", () => {
    expect(durationToMinutes("08:30")).toBeNull();
    expect(durationToMinutes({ hour: () => 8 })).toBeNull();
    expect(dateToDayKey(42)).toBeNull();
    expect(dateToDayKey({ format: "YYYY-MM-DD" })).toBeNull();
  });
});
