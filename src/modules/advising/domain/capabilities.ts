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
  | "group:manage"
  | "student:assign"
  | "schedule:read"
  | "schedule:write"
  | "homework:read"
  | "homework:write"
  | "study:read"
  | "study:write"
  | "rag:manage"
  | "user:manage";

// Admin deliberately contains the full counselor set plus the two admin-only
// capabilities — no inheritance mechanism; the plain table is the point.
export const CAPABILITIES: Record<Role, readonly Capability[]> = {
  student: [
    "profile:read",
    "profile:write",
    "schedule:read",
    "schedule:write",
    "homework:read",
    "homework:write",
    "study:read",
    "study:write",
  ],
  counselor: [
    "profile:read",
    "profile:write",
    "group:manage",
    "student:assign",
    "schedule:read",
    "schedule:write",
    "homework:read",
    "homework:write",
    "study:read",
    "study:write",
  ],
  admin: [
    "profile:read",
    "profile:write",
    "group:manage",
    "student:assign",
    "schedule:read",
    "schedule:write",
    "homework:read",
    "homework:write",
    "study:read",
    "study:write",
    "rag:manage",
    "user:manage",
  ],
};

/** Default deny: an unknown or missing role gets nothing. */
export function hasCapability(
  role: Role | undefined,
  capability: Capability,
): boolean {
  return role ? CAPABILITIES[role].includes(capability) : false;
}
