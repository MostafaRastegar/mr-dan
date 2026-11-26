import { describe, expect, it } from "vitest";

import {
  homeworkToggleSchema,
  makeHomeworkSchemas,
} from "./homework-schemas";

const SUBJECTS = ["riazi", "fizik"] as const;
const { homeworkSchema } = makeHomeworkSchemas(SUBJECTS);

describe("homework schema", () => {
  it("rejects an invalid calendar date (2026-02-30)", () => {
    const result = homeworkSchema.safeParse({
      title: "پrašش",
      deadline: "2026-02-30",
      priority: "low",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid calendar date", () => {
    const result = homeworkSchema.safeParse({
      title: "پrašش",
      deadline: "2026-12-01",
      priority: "low",
    });
    expect(result.success).toBe(true);
  });

  it("converts deadline to Iran midnight", () => {
    const parsed = homeworkSchema.parse({
      title: "پrašش",
      deadline: "2026-12-01",
      priority: "low",
    });
    // 2026-12-01 00:00 +03:30 = 2026-11-30 20:30 UTC
    expect(parsed.deadline.toISOString()).toBe("2026-11-30T20:30:00.000Z");
  });

  it("maps priority to rank number", () => {
    const low = homeworkSchema.parse({
      title: "t",
      deadline: "2026-12-01",
      priority: "low",
    });
    const high = homeworkSchema.parse({
      title: "t",
      deadline: "2026-12-01",
      priority: "high",
    });
    expect(low.priority).toBe(1);
    expect(high.priority).toBe(3);
  });

  it("treats empty subject as absent", () => {
    const parsed = homeworkSchema.parse({
      title: "t",
      deadline: "2026-12-01",
      priority: "low",
      subject: "",
    });
    expect(parsed.subject).toBeUndefined();
  });

  it("rejects a subject outside the runtime list", () => {
    expect(
      homeworkSchema.safeParse({
        title: "t",
        deadline: "2026-12-01",
        priority: "low",
        subject: "math",
      }).success,
    ).toBe(false);
    // Present in the domain historically, absent from this request's list (retired).
    expect(
      homeworkSchema.safeParse({
        title: "t",
        deadline: "2026-12-01",
        priority: "low",
        subject: "zist",
      }).success,
    ).toBe(false);
  });

  it("accepts a subject supplied by the runtime list", () => {
    const parsed = homeworkSchema.parse({
      title: "t",
      deadline: "2026-12-01",
      priority: "low",
      subject: "fizik",
    });
    expect(parsed.subject).toBe("fizik");
  });
});

describe("homework toggle schema", () => {
  it("coerces completed to boolean", () => {
    expect(homeworkToggleSchema.parse({ id: "1", completed: "true" })).toEqual({
      id: "1",
      completed: true,
    });
    expect(homeworkToggleSchema.parse({ id: "1", completed: "false" })).toEqual({
      id: "1",
      completed: false,
    });
  });

  it("requires id", () => {
    expect(
      homeworkToggleSchema.safeParse({ id: "", completed: "true" }).success,
    ).toBe(false);
  });
});
