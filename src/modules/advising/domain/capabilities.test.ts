import { describe, expect, it } from "vitest";

import { CAPABILITIES, hasCapability, type Capability } from "./capabilities";

describe("CAPABILITIES.admin", () => {
  it("contains every counselor capability", () => {
    for (const cap of CAPABILITIES.counselor) {
      expect(CAPABILITIES.admin).toContain(cap as Capability);
    }
  });

  it("contains the admin-only capabilities", () => {
    expect(CAPABILITIES.admin).toContain("rag:manage");
    expect(CAPABILITIES.admin).toContain("user:manage");
  });
});

describe("hasCapability", () => {
  it("counselor lacks rag:manage", () => {
    expect(hasCapability("counselor", "rag:manage")).toBe(false);
  });

  it("student lacks rag:manage", () => {
    expect(hasCapability("student", "rag:manage")).toBe(false);
  });

  it("admin keeps student:assign", () => {
    expect(hasCapability("admin", "student:assign")).toBe(true);
  });
});

describe("CAPABILITIES student write", () => {
  const writeCaps = [
    "schedule:write",
    "homework:write",
    "study:write",
  ] as const;

  it("student has all planning write capabilities", () => {
    for (const cap of writeCaps) {
      expect(hasCapability("student", cap)).toBe(true);
    }
  });

  it("counselor has planning read and write capabilities", () => {
    for (const cap of ["schedule:read", "schedule:write", "homework:read", "homework:write", "study:read", "study:write"] as const) {
      expect(hasCapability("counselor", cap)).toBe(true);
    }
  });

  it("admin is a superset of counselor", () => {
    for (const cap of CAPABILITIES.counselor) {
      expect(CAPABILITIES.admin).toContain(cap);
    }
  });
});
