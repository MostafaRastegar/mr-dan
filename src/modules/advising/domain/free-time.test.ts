import { describe, expect, it } from "vitest";

import {
  classMinutesForDay,
  dayCapacity,
  durationMessage,
  fitsCapacity,
  freeMinutesForDay,
  otherOccupiedMinutesForDay,
  schoolMinutesForDay,
  suggestFreeMinutes,
  type ClassInterval,
  wakingMinutes,
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

describe("wakingMinutes", () => {
  it("02:00 wake / 10:00 sleep → 960", () => {
    expect(wakingMinutes({ wakeMinutes: 120, sleepMinutes: 600 })).toBe(960);
  });

  it("06:30 wake / 23:00 sleep → 990", () => {
    expect(wakingMinutes({ wakeMinutes: 390, sleepMinutes: 1380 })).toBe(990);
  });

  it("equal wake and sleep → 1440", () => {
    expect(wakingMinutes({ wakeMinutes: 390, sleepMinutes: 390 })).toBe(1440);
  });

  it("00:00 wake / 00:00 sleep → 1440", () => {
    expect(wakingMinutes({ wakeMinutes: 0, sleepMinutes: 0 })).toBe(1440);
  });

  it("defaults: 06:30 / 23:00 → 990", () => {
    expect(wakingMinutes({ wakeMinutes: null, sleepMinutes: null })).toBe(990);
  });

  it("wrap past midnight: 23:00 wake / 02:00 sleep → 180", () => {
    expect(wakingMinutes({ wakeMinutes: 1380, sleepMinutes: 120 })).toBe(180);
  });
});

describe("schoolMinutesForDay", () => {
  const school = [
    { dayOfWeek: 1, minutes: 240 },
    { dayOfWeek: 1, minutes: 60 },
    { dayOfWeek: 2, minutes: 180 },
  ];

  it("sums all entries for the day", () => {
    expect(schoolMinutesForDay(school, 1)).toBe(300);
  });

  it("returns 0 for a day with no entries", () => {
    expect(schoolMinutesForDay(school, 3)).toBe(0);
  });
});

describe("otherOccupiedMinutesForDay", () => {
  const occupied = [60, 120, 180, 240, 300, 360, 420];

  it("reads the index for existing days", () => {
    expect(otherOccupiedMinutesForDay(occupied, 0)).toBe(60);
    expect(otherOccupiedMinutesForDay(occupied, 6)).toBe(420);
  });

  it("missing index reads 0", () => {
    expect(otherOccupiedMinutesForDay([], 3)).toBe(0);
    expect(otherOccupiedMinutesForDay([60, 120], 6)).toBe(0);
  });
});

describe("freeMinutesForDay", () => {
  const base = {
    wakeMinutes: 390,
    sleepMinutes: 1380,
    schoolMinutes: 240,
    otherOccupiedMinutes: 180,
    homeworkAverageMinutes: 60,
  };

  it("AC-14: 990 − 240 − 180 − 60 = 510", () => {
    expect(freeMinutesForDay(base)).toBe(510);
  });

  it("AC-15: clamps at 0, never negative", () => {
    const overfull = { ...base, schoolMinutes: 990, otherOccupiedMinutes: 180, homeworkAverageMinutes: 120 };
    expect(freeMinutesForDay(overfull)).toBe(0);
    const exactlyFull = { ...base, schoolMinutes: 750, otherOccupiedMinutes: 180, homeworkAverageMinutes: 60 };
    expect(freeMinutesForDay(exactlyFull)).toBe(0);
  });

  it("AC-16: missing index reads 0 (array shorter than 7)", () => {
    expect(otherOccupiedMinutesForDay([60], 3)).toBe(0);
    expect(otherOccupiedMinutesForDay([], 6)).toBe(0);
    expect(freeMinutesForDay({ ...base, otherOccupiedMinutes: 0 })).toBe(990 - 240 - 0 - 60);
  });

  it("AC-32: school entry of N lowers by exactly N; occupied +N lowers by exactly N", () => {
    const before = freeMinutesForDay(base);
    const withMoreSchool = { ...base, schoolMinutes: base.schoolMinutes + 30 };
    expect(freeMinutesForDay(withMoreSchool)).toBe(before - 30);
    const withMoreOccupied = { ...base, otherOccupiedMinutes: base.otherOccupiedMinutes + 30 };
    expect(freeMinutesForDay(withMoreOccupied)).toBe(before - 30);
  });

  it("never exceeds waking window", () => {
    const empty = { ...base, schoolMinutes: 0, otherOccupiedMinutes: 0, homeworkAverageMinutes: 0 };
    expect(freeMinutesForDay(empty)).toBe(990);
  });

  it("homework default null reads as 0", () => {
    const noHomework = { ...base, homeworkAverageMinutes: null };
    expect(freeMinutesForDay(noHomework)).toBe(990 - 240 - 180 - 0);
  });
});
