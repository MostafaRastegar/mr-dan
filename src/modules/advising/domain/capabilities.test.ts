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
    "budget:write",
  ] as const;

  it("student has all planning write capabilities", () => {
    for (const cap of writeCaps) {
      expect(hasCapability("student", cap)).toBe(true);
    }
  });

  it("counselor has planning read and write capabilities", () => {
    for (const cap of [
      "schedule:read",
      "schedule:write",
      "homework:read",
      "homework:write",
      "budget:read",
      "budget:write",
    ] as const) {
      expect(hasCapability("counselor", cap)).toBe(true);
    }
  });

  it("admin is a superset of counselor", () => {
    for (const cap of CAPABILITIES.counselor) {
      expect(CAPABILITIES.admin).toContain(cap);
    }
  });
});

describe("CAPABILITIES nutrition and leisure", () => {
  const nutritionLeisure = [
    "nutrition:read",
    "nutrition:write",
    "leisure:read",
  ] as const;

  it("student has nutrition and leisure capabilities", () => {
    for (const cap of nutritionLeisure) {
      expect(hasCapability("student", cap)).toBe(true);
    }
  });

  it("counselor has nutrition and leisure capabilities", () => {
    for (const cap of nutritionLeisure) {
      expect(hasCapability("counselor", cap)).toBe(true);
    }
  });

  it("admin has nutrition and leisure capabilities", () => {
    for (const cap of nutritionLeisure) {
      expect(hasCapability("admin", cap)).toBe(true);
    }
  });
});

describe("plan:write", () => {
  it("is held only by counselor and admin", () => {
    const roles = ["student", "counselor", "admin", "operator"] as const;
    expect(roles.filter((role) => hasCapability(role, "plan:write"))).toEqual([
      "counselor",
      "admin",
    ]);
  });
});

describe("catalog:manage", () => {
  it("is held only by admin", () => {
    const roles = ["student", "counselor", "admin", "operator"] as const;
    expect(roles.filter((role) => hasCapability(role, "catalog:manage"))).toEqual([
      "admin",
    ]);
  });
});

describe("CAPABILITIES operator", () => {
  it("holds user:read and user:support but never user:manage or rag:manage", () => {
    expect(hasCapability("operator", "user:read")).toBe(true);
    expect(hasCapability("operator", "user:support")).toBe(true);
    expect(hasCapability("operator", "user:manage")).toBe(false);
    expect(hasCapability("operator", "rag:manage")).toBe(false);
  });

  it("is a subset of admin", () => {
    for (const cap of CAPABILITIES.operator) {
      expect(CAPABILITIES.admin).toContain(cap);
    }
  });

  it("cannot write planning rows", () => {
    for (const cap of ["group:manage", "plan:write", "schedule:write"] as const) {
      expect(hasCapability("operator", cap)).toBe(false);
    }
  });
});
