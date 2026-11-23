import { describe, expect, it } from "vitest";

import { clockToMinutes, minutesToClock, overlaps } from "./schedule";

describe("clockToMinutes / minutesToClock", () => {
  it("round-trips whole hours", () => {
    expect(minutesToClock(clockToMinutes("08:00"))).toBe("08:00");
    expect(minutesToClock(clockToMinutes("13:45"))).toBe("13:45");
    expect(minutesToClock(clockToMinutes("23:59"))).toBe("23:59");
  });

  it("handles midnight", () => {
    expect(clockToMinutes("00:00")).toBe(0);
    expect(minutesToClock(0)).toBe("00:00");
  });
});

describe("overlaps", () => {
  it("touching intervals do not overlap", () => {
    expect(overlaps(480, 540, 540, 600)).toBe(false);
    expect(overlaps(540, 600, 480, 540)).toBe(false);
  });

  it("identical intervals overlap", () => {
    expect(overlaps(480, 540, 480, 540)).toBe(true);
  });

  it("containment overlaps", () => {
    expect(overlaps(480, 600, 500, 550)).toBe(true);
    expect(overlaps(500, 550, 480, 600)).toBe(true);
  });

  it("partial overlap overlaps", () => {
    expect(overlaps(480, 540, 520, 580)).toBe(true);
    expect(overlaps(520, 580, 480, 540)).toBe(true);
  });

  it("disjoint intervals do not overlap", () => {
    expect(overlaps(480, 540, 600, 660)).toBe(false);
    expect(overlaps(600, 660, 480, 540)).toBe(false);
  });
});
