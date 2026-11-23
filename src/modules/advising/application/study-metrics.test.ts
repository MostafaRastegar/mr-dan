import { describe, expect, it } from "vitest";

import {
  averageFocus,
  perSubjectTotals,
  productivityRate,
  startOfStudyDay,
  studyDayKey,
  summarizeMinutes,
} from "@/modules/advising/application/study-metrics";
import type { StudySessionRecord } from "@/modules/advising/domain/models";

function row(overrides: Partial<StudySessionRecord>): StudySessionRecord {
  return {
    id: "r",
    studentId: "s1",
    category: "study",
    subject: null,
    durationMinutes: 0,
    focusLevel: null,
    startedAt: new Date("2026-11-23T08:00:00Z"),
    createdAt: new Date("2026-11-23T08:00:00Z"),
    ...overrides,
  };
}

describe("study-metrics", () => {
  it("productivity rate", () => {
    const rows = [
      row({ category: "study", durationMinutes: 60 }),
      row({ category: "break", durationMinutes: 15 }),
      row({ category: "waste", durationMinutes: 25 }),
    ];
    const { study, break: b, waste } = summarizeMinutes(rows);
    expect(study).toBe(60);
    expect(b).toBe(15);
    expect(waste).toBe(25);
    expect(productivityRate(study, b, waste)).toBe(0.6);

    expect(productivityRate(0, 0, 0)).toBe(0);
  });

  it("study day boundary", () => {
    // 2026-11-23T20:45:00Z is 2026-11-24 in Iran (UTC+03:30 → 00:15 local)
    const instant = new Date("2026-11-23T20:45:00Z");
    expect(studyDayKey(instant)).toBe("2026-11-24");
    expect(startOfStudyDay(instant).toISOString()).toBe("2026-11-23T20:30:00.000Z");
  });

  it("per-subject totals", () => {
    const rows = [
      row({ category: "study", subject: "fizik", durationMinutes: 30 }),
      row({ category: "break", subject: "fizik", durationMinutes: 30 }),
      row({ category: "study", subject: "fizik", durationMinutes: 20 }),
      row({ category: "study", subject: "zist", durationMinutes: 10 }),
    ];
    const totals = perSubjectTotals(rows);
    expect(totals).toEqual([
      { subject: "fizik", minutes: 50 },
      { subject: "zist", minutes: 10 },
    ]);
  });

  it("empty analysis", () => {
    const { study, break: b, waste, total } = summarizeMinutes([]);
    expect(study).toBe(0);
    expect(b).toBe(0);
    expect(waste).toBe(0);
    expect(total).toBe(0);
    expect(productivityRate(0, 0, 0)).toBe(0);
    expect(averageFocus([])).toBeNull();
  });
});
