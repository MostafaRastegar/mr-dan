/**
 * Advising domain ports.
 *
 * Use cases depend only on these interfaces. Adapters live in
 * `infrastructure/` and are wired in `src/server/container.ts`.
 */

import type {
  Chapter,
  Exam,
  FreeTimeBudget,
  GroupSummary,
  HomeworkFilter,
  HomeworkItem,
  HomeworkPlanEntry,
  MealPlanRecord,
  Need,
  NewGroup,
  NewMealPlan,
  NewSchoolProgramEntry,
  NewStudyPlanEntry,
  NewSupplementaryCourse,
  NewUser,
  NewHomework,
  NewScheduleEntry,
  PhysicalProfile,
  PhysicalProfilePatch,
  ProfilePatch,
  ProfileView,
  SchoolProgramEntry,
  ScheduleEntryPatch,
  SessionRecord,
  StudentExamResult,
  StudentSummary,
  StudyPlan,
  StudyPlanEntry,
  SupplementaryCourse,
  UserAccount,
  WeeklyGoal,
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
  setCompletion(id: string, input: { completedAt: Date | null; spentMinutes: number | null }): Promise<HomeworkItem>;
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
  setEatenSlots(
    studentId: string,
    dayKey: string,
    slots: readonly string[],
  ): Promise<MealPlanRecord>;
}

export interface WeeklyGoalRepositoryPort {
  findByKey(
    studentId: string,
    weekKey: string,
  ): Promise<WeeklyGoal | null>;
  listInRange(
    studentId: string,
    fromWeekKey: string,
    toWeekKey: string,
  ): Promise<WeeklyGoal[]>;
  setCompletedBlocks(
    studentId: string,
    weekKey: string,
    blocks: readonly string[],
  ): Promise<WeeklyGoal>;
  incrementTestsDone(
    studentId: string,
    weekKey: string,
    delta: number,
  ): Promise<WeeklyGoal>;
  incrementSubjectTests(input: {
    studentId: string;
    weekKey: string;
    subject: string;
    count: number;
  }): Promise<void>;
}

export interface CatalogRepositoryPort {
  listNeeds(): Promise<Need[]>;
  listExams(): Promise<Exam[]>;
  findNeed(id: string): Promise<Need | null>;
  findExam(id: string): Promise<Exam | null>;
}

export interface ChapterRepositoryPort {
  listForSubject(input: {
    subject: string;
    grade: string | null;
    field: string | null;
  }): Promise<Chapter[]>;
  findByIds(ids: readonly string[]): Promise<Chapter[]>;
}

export interface SchoolProgramRepositoryPort {
  listByStudent(studentId: string): Promise<SchoolProgramEntry[]>;
  create(input: NewSchoolProgramEntry): Promise<SchoolProgramEntry>;
  delete(input: { id: string; studentId: string }): Promise<void>;
}

export interface StudyPlanRepositoryPort {
  findForStudent(studentId: string): Promise<StudyPlan | null>;
  upsertHeader(input: { studentId: string; counselorId: string; testsTarget: number }): Promise<StudyPlan>;
  upsertEntry(input: NewStudyPlanEntry): Promise<StudyPlanEntry>;
  deleteEntry(input: { studentId: string; entryId: string }): Promise<void>;
}

export interface StudentExamResultRepositoryPort {
  listRecent(studentId: string, take: number): Promise<StudentExamResult[]>;
  upsert(input: { studentId: string; examId: string; taraz: number }): Promise<StudentExamResult>;
}

export interface SupplementaryCourseRepositoryPort {
  listByStudent(studentId: string): Promise<SupplementaryCourse[]>;
  create(input: NewSupplementaryCourse): Promise<SupplementaryCourse>;
  delete(input: { id: string; studentId: string }): Promise<void>;
}
