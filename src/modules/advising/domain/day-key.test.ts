import { describe, expect, it } from "vitest";

import { iranDayKey, isDayKey, shiftDayKey, startOfIranDay } from "./day-key";

describe("day-key", () => {
  it("iranDayKey shifts UTC+03:30", () => {
    expect(iranDayKey(new Date("2026-11-23T10:00:00Z"))).toBe("2026-11-23");
    expect(iranDayKey(new Date("2026-11-23T20:29:59.999Z"))).toBe("2026-11-23");
    expect(iranDayKey(new Date("2026-11-23T20:30:00Z"))).toBe("2026-11-24");
  });

  it("iranDayKey at 20:45Z rolls to the next Iran day", () => {
    expect(iranDayKey(new Date("2026-11-23T20:45:00Z"))).toBe("2026-11-24");
  });

  it("startOfIranDay returns Iran midnight", () => {
    expect(startOfIranDay(new Date("2026-11-23T20:45:00Z")).toISOString()).toBe(
      "2026-11-23T20:30:00.000Z",
    );
    expect(startOfIranDay(new Date("2026-11-24T08:00:00Z")).toISOString()).toBe(
      "2026-11-23T20:30:00.000Z",
    );
  });

  it("shiftDayKey crosses a month boundary", () => {
    expect(shiftDayKey("2026-11-30", 1)).toBe("2026-12-01");
    expect(shiftDayKey("2026-12-01", -1)).toBe("2026-11-30");
    expect(shiftDayKey("2026-11-23", 0)).toBe("2026-11-23");
  });

  it("isDayKey rejects an impossible calendar date", () => {
    expect(isDayKey("2026-11-23")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("2026-13-01")).toBe(false);
    expect(isDayKey("2026-2-3")).toBe(false);
    expect(isDayKey("not-a-day")).toBe(false);
  });
});
