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
