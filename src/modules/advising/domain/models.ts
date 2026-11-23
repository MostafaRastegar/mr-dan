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

/** 0 = شنبه … 6 = جمعه (Persian week). */
export const DAYS_OF_WEEK: readonly { day: number; label: string }[] = [
  { day: 0, label: "شنبه" },
  { day: 1, label: "یکشنبه" },
  { day: 2, label: "دوشنبه" },
  { day: 3, label: "سه‌شنبه" },
  { day: 4, label: "چهارشنبه" },
  { day: 5, label: "پنج‌شنبه" },
  { day: 6, label: "جمعه" },
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]["day"];

/** study | break | waste — zod-validated at the boundary, not a PG enum. */
export const STUDY_CATEGORIES = ["study", "break", "waste"] as const;

export type StudyCategory = (typeof STUDY_CATEGORIES)[number];

/** 3 = high, 2 = medium, 1 = low. Postgres orders ints, text would need in-memory sort. */
export const HOMEWORK_PRIORITIES = { low: 1, medium: 2, high: 3 } as const;

export type HomeworkPriority = keyof typeof HOMEWORK_PRIORITIES;

/** Rank used for ordering: higher = more important. */
export const HOMEWORK_PRIORITY_RANK: Record<HomeworkPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Inverse of HOMEWORK_PRIORITIES: rank number → label. */
export const HOMEWORK_PRIORITY_LABEL: Record<number, HomeworkPriority> = {
  1: "low",
  2: "medium",
  3: "high",
};

export interface WeeklyScheduleEntry {
  id: string;
  studentId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewScheduleEntry {
  studentId: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  subject: string;
  teacher?: string | null;
  room?: string | null;
}

export interface ScheduleEntryPatch {
  dayOfWeek?: DayOfWeek;
  startMinute?: number;
  endMinute?: number;
  subject?: string;
  teacher?: string | null;
  room?: string | null;
}

export interface HomeworkItem {
  id: string;
  studentId: string;
  title: string;
  subject: string | null;
  priority: HomeworkPriority;
  deadline: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewHomework {
  studentId: string;
  title: string;
  subject?: string | null;
  priority: number;
  deadline: Date;
}

export type HomeworkFilter = "all" | "pending" | "done";

export interface StudySessionRecord {
  id: string;
  studentId: string;
  category: StudyCategory;
  subject: string | null;
  durationMinutes: number;
  focusLevel: number | null;
  startedAt: Date;
  createdAt: Date;
}

export interface NewStudySession {
  studentId: string;
  category: StudyCategory;
  subject?: string | null;
  durationMinutes: number;
  focusLevel?: number | null;
  startedAt: Date;
}
