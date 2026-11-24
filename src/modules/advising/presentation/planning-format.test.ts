import { describe, expect, it } from "vitest";

import type { HomeworkItem } from "../domain/models";
import {
  formatChapterList,
  formatClock,
  formatDeadline,
  formatDuration,
  homeworkStatus,
} from "./planning-format";

describe("planning format", () => {
  it("formatClock", () => {
    expect(formatClock(510)).toBe("۰۸:۳۰");
    expect(formatClock(0)).toBe("۰۰:۰۰");
    expect(formatClock(61)).toBe("۰۱:۰۱");
  });

  it("formatDeadline", () => {
    const formatted = formatDeadline(new Date("2026-12-01T20:30:00Z"));
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatted).toContain("/");
  });

  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("۰۰د");
    expect(formatDuration(45)).toBe("۴۵د");
    expect(formatDuration(90)).toBe("۰۱س ۳۰د");
    expect(formatDuration(1500)).toBe("۲۵س ۰۰د");
  });

  it("deadline status", () => {
    const todayKey = "2026-12-02";

    const done: HomeworkItem = {
      id: "1",
      studentId: "s",
      title: "t",
      subject: null,
      spentMinutes: null,
      priority: "high",
      deadline: new Date("2026-12-01T20:30:00Z"),
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(homeworkStatus(done, todayKey)).toBe("done");

    const overdue: HomeworkItem = {
      ...done,
      completedAt: null,
      deadline: new Date("2026-11-30T20:30:00Z"), // Iran Dec 1 → overdue vs Dec 2 todayKey
    };
    expect(homeworkStatus(overdue, todayKey)).toBe("overdue");

    const today: HomeworkItem = {
      ...done,
      completedAt: null,
      deadline: new Date("2026-12-01T20:30:00Z"), // Iran Dec 2 = todayKey
    };
    expect(homeworkStatus(today, todayKey)).toBe("today");

    const upcoming: HomeworkItem = {
      ...done,
      completedAt: null,
      deadline: new Date("2026-12-02T20:30:00Z"), // Iran Dec 3
    };
    expect(homeworkStatus(upcoming, todayKey)).toBe("upcoming");
  });

  it("formatChapterList", () => {
    const chapters = [
      { id: "c-2", number: 2 },
      { id: "c-1", number: 1 },
      { id: "c-3", number: 3 },
    ];
    expect(formatChapterList([], chapters)).toBe("—");
    expect(formatChapterList(["c-3", "c-1", "c-2"], chapters)).toBe(
      "فصل ۱، فصل ۲، فصل ۳",
    );
    expect(formatChapterList(["c-1", "c-missing"], chapters)).toBe(
      "فصل ۱، فصل نامشخص",
    );
    expect(formatChapterList(["c-missing"], chapters)).toBe(
      "فصل نامشخص",
    );
  });
});
