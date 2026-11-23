/**
 * Advising domain models.
 *
 * No external imports: this file is the product vocabulary shared by use cases,
 * ports and adapters. Persian option lists are frozen tuples so the UI and zod
 * schemas derive from one place.
 */

export type Role = "student" | "counselor" | "admin";

/** Pure role parsing: `"admin"→admin`, `"counselor"→counselor`, anything else → `"student"` (default deny). */
export function toRole(value: string): Role {
  if (value === "admin") return "admin";
  if (value === "counselor") return "counselor";
  return "student";
}

export const GRADES = ["دهم", "یازدهم", "دوازدهم", "فارغ‌التحصیل"] as const;

export const FIELDS = [
  "ریاضی فیزیک",
  "علوم تجربی",
  "علوم انسانی",
  "فنی حرفه‌ای",
] as const;

export type Grade = (typeof GRADES)[number];
export type FieldOfStudy = (typeof FIELDS)[number];

export interface UserAccount {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  fullName: string;
  grade: string | null;
  fieldOfStudy: string | null;
  schoolName: string | null;
  groupId: string | null;
  counselorId: string | null;
  createdAt: Date;
}

export interface ProfileView extends UserAccount {
  groupName: string | null;
  counselorName: string | null;
}

export interface StudentSummary {
  id: string;
  username: string;
  fullName: string;
  grade: string | null;
  fieldOfStudy: string | null;
  schoolName: string | null;
  groupId: string | null;
  groupName: string | null;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  targetGrade: string | null;
  targetField: string | null;
  color: string;
  counselorId: string;
  studentCount: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface NewUser {
  username: string;
  email: string | null;
  role: Role;
  fullName: string;
  grade: string | null;
  fieldOfStudy: string | null;
  schoolName: string | null;
  groupId: string | null;
  counselorId: string | null;
}

export interface ProfilePatch {
  fullName: string;
  email: string | null;
  grade: string | null;
  fieldOfStudy: string | null;
  schoolName: string | null;
}

export interface NewGroup {
  counselorId: string;
  name: string;
  description: string | null;
  targetGrade: string | null;
  targetField: string | null;
  color?: string;
}
