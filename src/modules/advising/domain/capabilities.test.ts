import { describe, expect, it } from "vitest";

import { CAPABILITIES, hasCapability, type Capability } from "./capabilities";
import type { Role } from "./models";

const ROLES: Role[] = ["student", "counselor", "admin", "operator"];

function holders(capability: string): Role[] {
  return ROLES.filter((role) =>
    (CAPABILITIES[role] as readonly string[]).includes(capability),
  );
}

describe("role×feature capability matrix", () => {
  it("schedule:write no longer exists on any role", () => {
    for (const role of ROLES) {
      expect(CAPABILITIES[role] as readonly string[]).not.toContain(
        "schedule:write",
      );
    }
  });

  it("counselor holds only profile + group + assign + plan", () => {
    expect([...CAPABILITIES.counselor].sort()).toEqual(
      [
        "profile:read",
        "profile:write",
        "group:manage",
        "student:assign",
        "plan:write",
      ].sort(),
    );
  });

  it("goal:write and program:write are student-only self-writes", () => {
    expect(holders("goal:write")).toEqual(["student"]);
    expect(holders("program:write")).toEqual(["student"]);
  });

  it("student keeps the student self-features and not plan:write", () => {
    const studentCaps: Capability[] = [
      "schedule:read",
      "homework:read",
      "homework:write",
      "budget:read",
      "budget:write",
      "nutrition:read",
      "nutrition:write",
      "leisure:read",
    ];
    for (const capability of studentCaps) {
      expect(hasCapability("student", capability)).toBe(true);
    }
    expect(hasCapability("student", "plan:write")).toBe(false);
  });

  it("admin loses every student-feature self capability", () => {
    const removed: Capability[] = [
      "schedule:read",
      "homework:read",
      "homework:write",
      "budget:read",
      "budget:write",
      "nutrition:read",
      "nutrition:write",
      "leisure:read",
      "goal:write",
      "program:write",
    ];
    for (const capability of removed) {
      expect(hasCapability("admin", capability)).toBe(false);
    }
  });

  it("admin gains supervise:read, admin-only", () => {
    expect(holders("supervise:read")).toEqual(["admin"]);
  });

  it("admin keeps the counselor-set writes and admin-only capabilities", () => {
    const kept: Capability[] = [
      "profile:read",
      "profile:write",
      "group:manage",
      "student:assign",
      "plan:write",
      "rag:manage",
      "user:read",
      "user:support",
      "user:manage",
      "catalog:manage",
    ];
    for (const capability of kept) {
      expect(hasCapability("admin", capability)).toBe(true);
    }
  });

  it("operator cannot write planning rows or supervise", () => {
    const denied: Capability[] = [
      "group:manage",
      "plan:write",
      "supervise:read",
      "homework:write",
      "goal:write",
      "program:write",
    ];
    for (const capability of denied) {
      expect(hasCapability("operator", capability)).toBe(false);
    }
  });

  it("operator holds user:read and user:support only, never user:manage/rag:manage", () => {
    expect(hasCapability("operator", "user:read")).toBe(true);
    expect(hasCapability("operator", "user:support")).toBe(true);
    expect(hasCapability("operator", "user:manage")).toBe(false);
    expect(hasCapability("operator", "rag:manage")).toBe(false);
  });
});
