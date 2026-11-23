import { describe, expect, it } from "vitest";

import { freeTimeSchema, planTimeSchema } from "./free-time-schemas";

const HOMEWORK_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

describe("free time schema", () => {
  it("free time parses hh:mm", () => {
    const parsed = freeTimeSchema.parse({
      date: "2026-12-01",
      freeTime: "02:00",
    });
    expect(parsed).toEqual({ date: "2026-12-01", freeTime: "02:00" });
    expect(
      freeTimeSchema.safeParse({ date: "2026-12-01", freeTime: "23:59" })
        .success,
    ).toBe(true);
  });

  it("free time rejects a malformed clock", () => {
    for (const freeTime of ["2:00", "24:00", "08:60", "08:30:00"]) {
      expect(
        freeTimeSchema.safeParse({ date: "2026-12-01", freeTime }).success,
      ).toBe(false);
    }
  });

  it("free time empty means the suggestion", () => {
    expect(
      freeTimeSchema.parse({ date: "2026-12-01", freeTime: "" }).freeTime,
    ).toBeNull();
    expect(
      freeTimeSchema.parse({ date: "2026-12-01", freeTime: null }).freeTime,
    ).toBeNull();
  });

  it("plan date must be a real calendar day", () => {
    const base = { homeworkId: HOMEWORK_ID, plannedTime: "01:00" };
    expect(
      planTimeSchema.safeParse({ ...base, date: "2026-02-30" }).success,
    ).toBe(false);
    expect(
      planTimeSchema.safeParse({ ...base, date: "2026-12-01" }).success,
    ).toBe(true);
  });

  it("plan minutes reject zero", () => {
    expect(
      planTimeSchema.safeParse({
        date: "2026-12-01",
        homeworkId: HOMEWORK_ID,
        plannedTime: "00:00",
      }).success,
    ).toBe(false);
  });

  it("plan date rejects a past-format year", () => {
    expect(
      planTimeSchema.safeParse({
        date: "26-12-01",
        homeworkId: HOMEWORK_ID,
        plannedTime: "01:00",
      }).success,
    ).toBe(false);
  });
});
