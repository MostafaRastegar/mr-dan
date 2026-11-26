/**
 * Advising domain ports.
 *
 * Use cases depend only on these interfaces. Adapters live in
 * `infrastructure/` and are wired in `src/server/container.ts`.
 */

import type {
  AdminUserRow,
  BookRow,
  Chapter,
  Exam,
  FieldRow,
  FreeTimeBudget,
  GradeRow,
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
  Page,
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
  SubjectRow,
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
  listSubjectTests(input: {
    studentId: string;
    weekKey: string;
  }): Promise<{ subject: string; count: number }[]>;
}

/** 1-based page query. Use cases clamp page/pageSize before calling a port. */
export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface CatalogRepositoryPort {
  listNeeds(): Promise<Need[]>;
  listExams(): Promise<Exam[]>;
  findNeed(id: string): Promise<Need | null>;
  findExam(id: string): Promise<Exam | null>;
  listFields(): Promise<FieldRow[]>;
  listGrades(): Promise<GradeRow[]>;
  /** Active rows only; option lists. */
  listSubjects(): Promise<SubjectRow[]>;
  /** Every subject, retired included; stored slugs keep rendering their label. */
  listSubjectLabels(): Promise<SubjectRow[]>;
  listBooks(): Promise<BookRow[]>;
}

/** Admin read/write surface for the catalog entities, including retired rows. */
export interface CatalogAdminRepositoryPort {
  listFields(query: PageQuery): Promise<Page<FieldRow>>;
  listGrades(query: PageQuery): Promise<Page<GradeRow>>;
  listSubjects(query: PageQuery): Promise<Page<SubjectRow>>;
  listBooks(query: PageQuery): Promise<Page<BookRow>>;
  listNeeds(query: PageQuery): Promise<Page<Need>>;
  listExams(query: PageQuery): Promise<Page<Exam>>;
  listChapters(query: PageQuery): Promise<Page<Chapter>>;

  findFieldByLabel(label: string): Promise<FieldRow | null>;
  findGradeByLabel(label: string): Promise<GradeRow | null>;
  findSubjectBySlug(slug: string): Promise<SubjectRow | null>;
  findBookBySlug(slug: string): Promise<BookRow | null>;
  findNeedByCode(code: string): Promise<Need | null>;
  findExamByCode(code: string): Promise<Exam | null>;
  findChapterByKey(input: {
    subject: string;
    field: string;
    grade: string;
    number: number;
  }): Promise<Chapter | null>;

  upsertField(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<FieldRow>;
  upsertGrade(input: {
    id?: string;
    label: string;
    sortOrder?: number;
  }): Promise<GradeRow>;
  upsertSubject(input: {
    id?: string;
    slug: string;
    label: string;
    fieldLabels: string[];
    gradeLabels: string[];
    sortOrder?: number;
  }): Promise<SubjectRow>;
  upsertBook(input: {
    id?: string;
    slug: string;
    title: string;
    author: string;
    fieldLabel: string | null;
    codes: string[];
    sortOrder?: number;
  }): Promise<BookRow>;
  /** `code` is required on create; omit it on update to keep the stored code. */
  upsertNeed(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Need>;
  upsertExam(input: {
    id?: string;
    code?: string;
    label: string;
  }): Promise<Exam>;
  upsertChapter(input: {
    id?: string;
    subject: string;
    field: string;
    grade: string;
    number: number;
    title: string;
  }): Promise<Chapter>;

  retireField(id: string): Promise<void>;
  reactivateField(id: string): Promise<void>;
  retireGrade(id: string): Promise<void>;
  reactivateGrade(id: string): Promise<void>;
  retireSubject(id: string): Promise<void>;
  reactivateSubject(id: string): Promise<void>;
  retireBook(id: string): Promise<void>;
  reactivateBook(id: string): Promise<void>;
  retireNeed(id: string): Promise<void>;
  reactivateNeed(id: string): Promise<void>;
  retireExam(id: string): Promise<void>;
  reactivateExam(id: string): Promise<void>;
  retireChapter(id: string): Promise<void>;
  reactivateChapter(id: string): Promise<void>;
}

/** Admin user directory: paginated, role mutation only. */
export interface AdminUsersRepositoryPort {
  listUsers(query: PageQuery): Promise<Page<AdminUserRow>>;
  findById(id: string): Promise<AdminUserRow | null>;
  countAdmins(): Promise<number>;
  updateRole(userId: string, role: AdminUserRow["role"]): Promise<void>;
  /** Support edit: display name + contact email only, never the role. */
  updateProfile(
    userId: string,
    input: { fullName: string; email: string | null },
  ): Promise<void>;
  /** Stores only the hash; the plaintext temp password never touches the DB. */
  resetPasswordHash(userId: string, passwordHash: string): Promise<void>;
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
