import { describe, expect, it } from "vitest";

import { studySessionSchemaAt } from "./study-schemas";

const now = new Date("2026-11-23T10:00:00Z");

describe("study session schema", () => {
  it("duration bounds", () => {
    const schema = studySessionSchemaAt(now);
    expect(
      schema.safeParse({
        category: "study",
        durationMinutes: 0,
        startedAt: "2026-11-23T10:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        category: "study",
        durationMinutes: 1441,
        startedAt: "2026-11-23T10:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        category: "study",
        durationMinutes: 30,
        startedAt: "2026-11-23T10:00:00Z",
      }).success,
    ).toBe(true);
  });

  it("future session", () => {
    const schema = studySessionSchemaAt(now);
    const fiveMinLater = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const sixMinLater = new Date(now.getTime() + 6 * 60 * 1000).toISOString();

    expect(
      schema.safeParse({
        category: "study",
        durationMinutes: 30,
        startedAt: fiveMinLater,
      }).success,
    ).toBe(true);

    expect(
      schema.safeParse({
        category: "study",
        durationMinutes: 30,
        startedAt: sixMinLater,
      }).success,
    ).toBe(false);
  });
});
