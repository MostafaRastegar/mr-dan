import { describe, expect, it } from "vitest";

import {
  classMinutesForDay,
  dayCapacity,
  durationMessage,
  fitsCapacity,
  suggestFreeMinutes,
  type ClassInterval,
} from "./free-time";

const fiveHours: ClassInterval[] = [{ dayOfWeek: 0, startMinute: 480, endMinute: 780 }];

describe("free-time", () => {
  it("suggestFreeMinutes subtracts class minutes", () => {
    expect(classMinutesForDay(fiveHours, 0)).toBe(300);
    expect(suggestFreeMinutes(fiveHours, 0)).toBe(540);
    expect(suggestFreeMinutes(fiveHours, 1)).toBe(840);
  });

  it("suggestFreeMinutes merges overlapping classes", () => {
    const overlapping: ClassInterval[] = [
      { dayOfWeek: 2, startMinute: 540, endMinute: 700 },
      { dayOfWeek: 2, startMinute: 480, endMinute: 600 },
      { dayOfWeek: 3, startMinute: 480, endMinute: 600 },
    ];
    expect(classMinutesForDay(overlapping, 2)).toBe(220);
    expect(suggestFreeMinutes(overlapping, 2)).toBe(620);
  });

  it("suggestFreeMinutes never goes below zero", () => {
    const overfull: ClassInterval[] = [{ dayOfWeek: 4, startMinute: 0, endMinute: 900 }];
    expect(suggestFreeMinutes(overfull, 4)).toBe(0);
  });

  it("dayCapacity treats a missing budget row as zero", () => {
    expect(dayCapacity(null, 0)).toEqual({
      freeMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0,
    });
    expect(dayCapacity(null, 30)).toEqual({
      freeMinutes: 0,
      usedMinutes: 30,
      remainingMinutes: 0,
    });
  });

  it("dayCapacity clamps remaining at zero", () => {
    expect(dayCapacity(120, 200)).toEqual({
      freeMinutes: 120,
      usedMinutes: 200,
      remainingMinutes: 0,
    });
    expect(dayCapacity(300, 120).remainingMinutes).toBe(180);
  });

  it("fitsCapacity accepts exactly the free minutes", () => {
    expect(fitsCapacity(dayCapacity(300, 0), 300)).toBe(true);
    expect(fitsCapacity(dayCapacity(300, 120), 180)).toBe(true);
  });

  it("fitsCapacity rejects one minute over", () => {
    expect(fitsCapacity(dayCapacity(300, 0), 301)).toBe(false);
    expect(fitsCapacity(dayCapacity(300, 120), 181)).toBe(false);
  });

  it("fitsCapacity rejects a non-positive addition", () => {
    expect(fitsCapacity(dayCapacity(300, 0), 0)).toBe(false);
    expect(fitsCapacity(dayCapacity(300, 0), -5)).toBe(false);
  });

  it("durationMessage renders used of free in Persian", () => {
    expect(durationMessage(180, 300)).toBe("۳ ساعت از ۵ ساعت");
    expect(durationMessage(150, 300)).toBe("۲ ساعت و ۳۰ دقیقه از ۵ ساعت");
    expect(durationMessage(30, 60)).toBe("۳۰ دقیقه از ۱ ساعت");
    expect(durationMessage(0, 0)).toBe("۰ دقیقه از ۰ دقیقه");
  });
});
