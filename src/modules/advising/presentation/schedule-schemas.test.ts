import { describe, expect, it } from "vitest";

import { deleteByIdSchema, makeScheduleSchemas } from "./schedule-schemas";

const SUBJECTS = ["riazi", "zist"] as const;
const { scheduleEntrySchema } = makeScheduleSchemas(SUBJECTS);

describe("schedule entry schema", () => {
  const base = {
    dayOfWeek: 1,
    startTime: "08:00",
    endTime: "09:00",
    subject: "riazi",
  };

  it("end must be after start", () => {
    const result = scheduleEntrySchema.safeParse({
      ...base,
      startTime: "09:00",
      endTime: "08:00",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["endTime"]);
      expect(result.error.issues[0].message).toBe("پایان باید بعد از شروع باشد");
    }
  });

  it("dayOfWeek bounds", () => {
    expect(
      scheduleEntrySchema.safeParse({ ...base, dayOfWeek: -1 }).success,
    ).toBe(false);
    expect(
      scheduleEntrySchema.safeParse({ ...base, dayOfWeek: 7 }).success,
    ).toBe(false);
    expect(
      scheduleEntrySchema.safeParse({ ...base, dayOfWeek: 0 }).success,
    ).toBe(true);
    expect(
      scheduleEntrySchema.safeParse({ ...base, dayOfWeek: 6 }).success,
    ).toBe(true);
  });

  it("accepts only subjects from the runtime list", () => {
    expect(
      scheduleEntrySchema.safeParse({ ...base, subject: "math" }).success,
    ).toBe(false);
    expect(
      scheduleEntrySchema.safeParse({ ...base, subject: "riazi" }).success,
    ).toBe(true);
    expect(
      scheduleEntrySchema.safeParse({ ...base, subject: "zist" }).success,
    ).toBe(true);
    // Known domain slug, but not in the list this schema was built from.
    expect(
      scheduleEntrySchema.safeParse({ ...base, subject: "fizik" }).success,
    ).toBe(false);
  });
});

describe("delete by id schema", () => {
  it("requires a non-empty id", () => {
    expect(deleteByIdSchema.safeParse({ id: "" }).success).toBe(false);
    expect(deleteByIdSchema.safeParse({ id: "abc" }).success).toBe(true);
  });
});
