/**
 * One capability map for the whole module.
 *
 * UI gating is UX; the security boundary stays in the use cases, which call
 * `hasCapability` too. Adding a role means adding a row here, never a scattered
 * `role === "..."` check.
 */

import type { Role } from "./models";

export type Capability =
  | "profile:read"
  | "profile:write"
  | "goal:write"
  | "program:write"
  | "group:manage"
  | "student:assign"
  | "plan:write"
  | "schedule:read"
  | "homework:read"
  | "homework:write"
  | "budget:read"
  | "budget:write"
  | "nutrition:read"
  | "nutrition:write"
  | "leisure:read"
  | "supervise:read"
  | "rag:manage"
  | "user:read"
  | "user:support"
  | "user:manage"
  | "catalog:manage";

// Weekly schedule authoring is NOT a capability: it is `plan:write` plus
// counselor-of-record (assertCounselorOfStudent), so no role holds a
// self-serve schedule write. Homework, nutrition, budget, weekly goal and the
// school program are student self-features. Admin deliberately holds only the
// counselor-set writes plus `supervise:read`: supervision happens inside the
// student-detail surface, never through a student self-page.
// `operator` is a limited support login: user directory + support edits, never
// `rag:manage` or `user:manage` (role changes stay admin-only).
export const CAPABILITIES: Record<Role, readonly Capability[]> = {
  student: [
    "profile:read",
    "profile:write",
    "goal:write",
    "program:write",
    "schedule:read",
    "homework:read",
    "homework:write",
    "budget:read",
    "budget:write",
    "nutrition:read",
    "nutrition:write",
    "leisure:read",
  ],
  counselor: [
    "profile:read",
    "profile:write",
    "group:manage",
    "student:assign",
    "plan:write",
  ],
  admin: [
    "profile:read",
    "profile:write",
    "group:manage",
    "student:assign",
    "plan:write",
    "supervise:read",
    "rag:manage",
    "user:read",
    "user:support",
    "user:manage",
    "catalog:manage",
  ],
  operator: [
    "profile:read",
    "profile:write",
    "user:read",
    "user:support",
  ],
};

/** Default deny: an unknown or missing role gets nothing. */
export function hasCapability(
  role: Role | undefined,
  capability: Capability,
): boolean {
  return role ? CAPABILITIES[role].includes(capability) : false;
}
