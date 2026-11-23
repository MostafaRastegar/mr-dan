/**
 * Advising domain ports.
 *
 * Use cases depend only on these interfaces. Adapters live in
 * `infrastructure/` and are wired in `src/server/container.ts`.
 */

import type {
  GroupSummary,
  HomeworkFilter,
  HomeworkItem,
  NewGroup,
  NewUser,
  NewHomework,
  NewScheduleEntry,
  NewStudySession,
  ProfilePatch,
  ProfileView,
  ScheduleEntryPatch,
  SessionRecord,
  StudySessionRecord,
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

export interface StudySessionRepositoryPort {
  create(input: NewStudySession): Promise<StudySessionRecord>;
  listByStudentInRange(studentId: string, from: Date, to: Date): Promise<StudySessionRecord[]>;
}
