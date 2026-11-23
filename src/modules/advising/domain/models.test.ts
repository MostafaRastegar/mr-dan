import { describe, expect, it } from "vitest";

import { toRole } from "./models";

describe("toRole", () => {
  it('maps "admin" to admin', () => {
    expect(toRole("admin")).toBe("admin");
  });

  it('maps "counselor" to counselor', () => {
    expect(toRole("counselor")).toBe("counselor");
  });

  it('maps "student" to student', () => {
    expect(toRole("student")).toBe("student");
  });

  it('maps anything else to student (default deny)', () => {
    expect(toRole("garbage")).toBe("student");
    expect(toRole("")).toBe("student");
    expect(toRole("ADMIN")).toBe("student");
  });
});
