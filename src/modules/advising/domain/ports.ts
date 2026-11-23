/**
 * Advising domain ports.
 *
 * Use cases depend only on these interfaces. Adapters live in
 * `infrastructure/` and are wired in `src/server/container.ts`.
 */

import type {
  FreeTimeBudget,
  GroupSummary,
  HomeworkFilter,
  HomeworkItem,
  HomeworkPlanEntry,
  MealPlanRecord,
  NewGroup,
  NewMealPlan,
  NewUser,
  NewHomework,
  NewScheduleEntry,
  PhysicalProfile,
  PhysicalProfilePatch,
  ProfilePatch,
  ProfileView,
  ScheduleEntryPatch,
  SessionRecord,
  StudentSummary,
  UserAccount,
  WeeklyScheduleEntry,
} from "./models";

export interface UserRepositoryPort {
  findCredentialsByUsername(
    username: string,
  ): Promise<{ user: UserAccount; passwordHash: string } | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  findProfileById(id: string): Promise<ProfileView | null>;
  create(input: NewUser & { passwordHash: string }): Promise<UserAccount>;
  updateProfile(id: string, patch: ProfilePatch): Promise<UserAccount>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  listAssignableStudents(counselorId: string): Promise<StudentSummary[]>;
  assignToGroup(input: {
    studentId: string;
    groupId: string | null;
    counselorId?: string;
  }): Promise<void>;
  findPhysicalProfile(id: string): Promise<PhysicalProfile | null>;
  updatePhysicalProfile(id: string, patch: PhysicalProfilePatch): Promise<PhysicalProfile>;
}

export interface SessionRepositoryPort {
  create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteManyByUserId(userId: string, exceptTokenHash?: string): Promise<void>;
}

export interface GroupRepositoryPort {
  create(input: NewGroup): Promise<GroupSummary>;
  findById(id: string): Promise<GroupSummary | null>;
  listByCounselor(counselorId: string): Promise<GroupSummary[]>;
}

export interface AuthCryptoPort {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, stored: string): Promise<boolean>;
  generateToken(): string;
  hashToken(token: string): string;
}

export interface ScheduleRepositoryPort {
  listByStudent(studentId: string): Promise<WeeklyScheduleEntry[]>;
  findById(id: string): Promise<WeeklyScheduleEntry | null>;
  create(input: NewScheduleEntry): Promise<WeeklyScheduleEntry>;
  update(id: string, patch: ScheduleEntryPatch): Promise<WeeklyScheduleEntry>;
  delete(id: string): Promise<void>;
}

export interface HomeworkRepositoryPort {
  listByStudent(studentId: string, filter: HomeworkFilter): Promise<HomeworkItem[]>;
  findById(id: string): Promise<HomeworkItem | null>;
  create(input: NewHomework): Promise<HomeworkItem>;
  setCompletedAt(id: string, completedAt: Date | null): Promise<HomeworkItem>;
  delete(id: string): Promise<void>;
}

export type UpsertWithinUsedResult =
  | { ok: true; budget: FreeTimeBudget }
  | { ok: false; usedMinutes: number };

export type UpsertWithinCapacityResult =
  | { ok: true; entry: HomeworkPlanEntry }
  | { ok: false; freeMinutes: number | null; usedMinutes: number };

export interface FreeTimeBudgetRepositoryPort {
  findByDay(studentId: string, dayKey: string): Promise<FreeTimeBudget | null>;
  listInRange(studentId: string, fromKey: string, toKey: string): Promise<FreeTimeBudget[]>;
  /** `usedMinutes` is the day's planned total; `allows` decides whether the write may proceed. */
  upsertWithinUsed(input: {
    studentId: string;
    dayKey: string;
    freeMinutes: number;
    allows: (usedMinutes: number) => boolean;
  }): Promise<UpsertWithinUsedResult>;
}

export interface HomeworkPlanRepositoryPort {
  listByDay(studentId: string, dayKey: string): Promise<HomeworkPlanEntry[]>;
  listByStudentInRange(
    studentId: string,
    fromKey: string,
    toKey: string,
  ): Promise<HomeworkPlanEntry[]>;
  findByHomeworkAndDay(homeworkId: string, dayKey: string): Promise<HomeworkPlanEntry | null>;
  /** `usedMinutes` excludes the row being upserted; `allows` decides whether the write may proceed. */
  upsertWithinCapacity(input: {
    studentId: string;
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
    allows: (current: { freeMinutes: number | null; usedMinutes: number }) => boolean;
  }): Promise<UpsertWithinCapacityResult>;
  /** Student-scoped so an id from another student can never be deleted. */
  delete(input: { id: string; studentId: string }): Promise<void>;
}

export interface MealPlanRepositoryPort {
  findByDay(studentId: string, dayKey: string): Promise<MealPlanRecord | null>;
  upsert(input: NewMealPlan): Promise<MealPlanRecord>;
}
