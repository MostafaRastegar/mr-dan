/**
 * Advising domain models.
 *
 * No external imports: this file is the product vocabulary shared by use cases,
 * ports and adapters. Persian option lists are frozen tuples so the UI and zod
 * schemas derive from one place.
 */

import type { MealSlot } from "./energy";

export type {
  ActivityLevel,
  CompletePhysicalProfile,
  DietGoal,
  Gender,
  PhysicalProfile,
  PhysicalProfilePatch,
} from "./energy";

export type Role = "student" | "counselor" | "admin" | "operator";

/** Pure role parsing: `"admin"→admin`, `"operator"→operator`, `"counselor"→counselor`, anything else → `"student"` (default deny). */
export function toRole(value: string): Role {
  if (value === "admin") return "admin";
  if (value === "operator") return "operator";
  if (value === "counselor") return "counselor";
  return "student";
}

/** Shared numeric limits for advising forms (minutes unless noted otherwise). */
export const TARAZ_MIN = 0;
export const TARAZ_MAX = 10000;
export const OTHER_OCCUPIED_MAX = 720; // 12h non-school per weekday
export const HOMEWORK_AVERAGE_MAX = 720;
export const NOTE_MAX = 200;
export const CHAPTERS_MAX_PER_ENTRY = 10;
export const COURSE_WEEKLY_HOURS_MAX = 30;

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
  sleepMinutes: number | null;
  wakeMinutes: number | null;
  schoolMode: string | null;
  needId: string | null;
  takesMockExams: boolean | null;
  otherOccupiedMinutes: number[] | null;
  homeworkAverageMinutes: number | null;
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

export interface FieldRow {
  id: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export interface GradeRow {
  id: string;
  label: string;
  active: boolean;
  sortOrder: number;
}

export interface SubjectRow {
  id: string;
  slug: string;
  label: string;
  fieldLabels: string[];
  gradeLabels: string[];
  active: boolean;
  sortOrder: number;
}

export interface BookRow {
  id: string;
  slug: string;
  title: string;
  author: string;
  fieldLabel: string | null;
  codes: string[];
  active: boolean;
  sortOrder: number;
}

export interface AdminUserRow {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: Role;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
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
  fullName?: string;
  email?: string | null;
  grade?: string | null;
  fieldOfStudy?: string | null;
  schoolName?: string | null;
  sleepMinutes?: number | null;
  wakeMinutes?: number | null;
  schoolMode?: string | null;
  needId?: string | null;
  takesMockExams?: boolean | null;
  otherOccupiedMinutes?: number[] | null;
  homeworkAverageMinutes?: number | null;
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

export interface Chapter {
  id: string;
  subject: string;
  field: string;
  grade: string;
  number: number;
  title: string;
  active: boolean;
}

export interface SchoolProgramEntry {
  id: string;
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  counselorId: string;
  testsTarget: number;
  entries: StudyPlanEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyPlanEntry {
  id: string;
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  chapterIds: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Need {
  id: string;
  code: string;
  label: string;
  active: boolean;
}

export interface Exam {
  id: string;
  code: string;
  label: string;
  active: boolean;
}

export interface StudentExamResult {
  id: string;
  studentId: string;
  examId: string;
  taraz: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplementaryCourse {
  id: string;
  studentId: string;
  title: string;
  mode: string;
  weeklyMinutes: number | null;
  createdAt: Date;
}

export interface TestRecord {
  id: string;
  studentId: string;
  subject: string;
  weekKey: string;
  count: number;
  updatedAt: Date;
}

export interface NewSchoolProgramEntry {
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
}

export interface NewStudyPlanEntry {
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  chapterIds: string[];
  note: string | null;
}

export interface NewSupplementaryCourse {
  studentId: string;
  title: string;
  mode: string;
  weeklyMinutes: number | null;
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
  spentMinutes: number | null;
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

export interface FreeTimeBudget {
  id: string;
  studentId: string;
  dayKey: string;
  freeMinutes: number;
}

export interface HomeworkPlanEntry {
  id: string;
  studentId: string;
  dayKey: string;
  homeworkId: string;
  plannedMinutes: number;
}

export interface NewHomeworkPlanEntry {
  studentId: string;
  dayKey: string;
  homeworkId: string;
  plannedMinutes: number;
}

export interface MealPlanItem {
  slot: MealSlot;
  label: string;
  calories: number;
}

export interface MealPlanRecord {
  id: string;
  studentId: string;
  dayKey: string;
  targetCalories: number;
  meals: MealPlanItem[];
  eatenSlots: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NewMealPlan {
  studentId: string;
  dayKey: string;
  targetCalories: number;
  meals: MealPlanItem[];
}

export interface WeeklyGoal {
  id: string;
  studentId: string;
  weekKey: string;
  testsDone: number;
  completedBlocks: string[];
  createdAt: Date;
  updatedAt: Date;
}
