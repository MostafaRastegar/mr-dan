/**
 * In-memory advising fakes for use-case unit tests.
 *
 * They implement the real ports (never Prisma) so the application layer is
 * tested without a database. `createAdvisingFakes()` shares group names and
 * member counts between the user and group fakes.
 */

import { createHash } from "node:crypto";

import {
  EmailTakenError,
  UsernameTakenError,
} from "@/modules/advising/domain/errors";
import type {
  GroupSummary,
  NewGroup,
  NewUser,
  Page,
  PhysicalProfile,
  PhysicalProfilePatch,
  ProfilePatch,
  ProfileView,
  SessionRecord,
  StudentSummary,
  UserAccount,
} from "@/modules/advising/domain/models";
import type {
  AuthCryptoPort,
  GroupRepositoryPort,
  SessionRepositoryPort,
  UserRepositoryPort,
} from "@/modules/advising/domain/ports";

type UserRow = UserAccount & { passwordHash: string };

type SessionRow = SessionRecord & { tokenHash: string };

type GroupRow = Omit<GroupSummary, "studentCount">;

interface SharedState {
  groupNames: Map<string, string>;
  groupCounts: Map<string, number>;
}

function toAccount(row: UserRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    fullName: row.fullName,
    grade: row.grade,
    fieldOfStudy: row.fieldOfStudy,
    schoolName: row.schoolName,
    groupId: row.groupId,
    counselorId: row.counselorId,
    sleepMinutes: row.sleepMinutes,
    wakeMinutes: row.wakeMinutes,
    schoolMode: row.schoolMode,
    needId: row.needId,
    takesMockExams: row.takesMockExams,
    otherOccupiedMinutes: row.otherOccupiedMinutes,
    homeworkAverageMinutes: row.homeworkAverageMinutes,
    createdAt: row.createdAt,
  };
}

export class FakeAuthCrypto implements AuthCryptoPort {
  private sequence = 0;

  async hashPassword(plain: string): Promise<string> {
    return `scrypt$16384$8$1$fakesalt$${createHash("sha256").update(plain).digest("hex")}`;
  }

  async verifyPassword(plain: string, stored: string): Promise<boolean> {
    return (await this.hashPassword(plain)) === stored;
  }

  generateToken(): string {
    this.sequence += 1;
    return `test-token-${this.sequence}`;
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

export class FakeUserRepository implements UserRepositoryPort {
  private readonly rows = new Map<string, UserRow>();
  private readonly physical = new Map<string, PhysicalProfile>();
  private sequence = 0;

  constructor(private readonly state: SharedState) {}

  all(): UserAccount[] {
    return [...this.rows.values()].map(toAccount);
  }

  count(): number {
    return this.rows.size;
  }

  rowByUsername(username: string): UserRow | null {
    for (const row of this.rows.values()) {
      if (row.username === username) return row;
    }
    return null;
  }

  async findCredentialsByUsername(
    username: string,
  ): Promise<{ user: UserAccount; passwordHash: string } | null> {
    for (const row of this.rows.values()) {
      if (row.username === username) {
        return { user: toAccount(row), passwordHash: row.passwordHash };
      }
    }
    return null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    for (const row of this.rows.values()) {
      if (row.email === email) return toAccount(row);
    }
    return null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const row = this.rows.get(id);
    return row ? toAccount(row) : null;
  }

  async findProfileById(id: string): Promise<ProfileView | null> {
    const row = this.rows.get(id);
    if (!row) return null;

    const groupName = row.groupId
      ? this.state.groupNames.get(row.groupId) ?? null
      : null;
    const counselor = row.counselorId
      ? this.rows.get(row.counselorId)
      : undefined;

    return {
      ...toAccount(row),
      groupName,
      counselorName: counselor?.fullName ?? null,
    };
  }

  async create(
    input: NewUser & { passwordHash: string; id?: string },
  ): Promise<UserAccount> {
    for (const row of this.rows.values()) {
      if (row.username === input.username) throw new UsernameTakenError();
      if (input.email && row.email === input.email) throw new EmailTakenError();
    }

    this.sequence += 1;
    const row: UserRow = {
      id: input.id ?? `user-${this.sequence}`,
      username: input.username,
      email: input.email,
      role: input.role,
      fullName: input.fullName,
      grade: input.grade,
      fieldOfStudy: input.fieldOfStudy,
      schoolName: input.schoolName,
      groupId: input.groupId,
      counselorId: input.counselorId,
      sleepMinutes: null,
      wakeMinutes: null,
      schoolMode: null,
      needId: null,
      takesMockExams: null,
      otherOccupiedMinutes: [0, 0, 0, 0, 0, 0, 0],
      homeworkAverageMinutes: null,
      createdAt: new Date(2026, 0, 1),
      passwordHash: input.passwordHash,
    };
    this.rows.set(row.id, row);
    return toAccount(row);
  }

  async updateProfile(id: string, patch: ProfilePatch): Promise<UserAccount> {
    const row = this.rows.get(id);
    if (!row) throw new Error("user not found");

    for (const other of this.rows.values()) {
      if (other.id !== id && patch.email && other.email === patch.email) {
        throw new EmailTakenError();
      }
    }

    row.fullName = patch.fullName ?? row.fullName;
    row.email = patch.email ?? row.email;
    row.grade = patch.grade ?? row.grade;
    row.fieldOfStudy = patch.fieldOfStudy ?? row.fieldOfStudy;
    row.schoolName = patch.schoolName ?? row.schoolName;
    row.sleepMinutes = patch.sleepMinutes ?? null;
    row.wakeMinutes = patch.wakeMinutes ?? null;
    return toAccount(row);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.passwordHash = passwordHash;
  }

  async listAssignableStudents(counselorId: string): Promise<StudentSummary[]> {
    return [...this.rows.values()]
      .filter(
        (row) =>
          row.role === "student" &&
          (row.counselorId === counselorId || row.counselorId === null),
      )
      .map((row) => ({
        id: row.id,
        username: row.username,
        fullName: row.fullName,
        grade: row.grade,
        fieldOfStudy: row.fieldOfStudy,
        schoolName: row.schoolName,
        groupId: row.groupId,
        groupName: row.groupId
          ? this.state.groupNames.get(row.groupId) ?? null
          : null,
        counselorId: row.counselorId,
      }));
  }

  async listStudentsPaged(
    scope: "mine" | "unassigned",
    counselorId: string,
    page: number,
    pageSize: number,
  ): Promise<Page<StudentSummary>> {
    const all = (await this.listAssignableStudents(counselorId)).filter(
      (row) =>
        scope === "mine"
          ? row.counselorId === counselorId
          : row.counselorId === null,
    );
    const start = (page - 1) * pageSize;
    return {
      items: all.slice(start, start + pageSize),
      page,
      pageSize,
      total: all.length,
    };
  }

  async assignToGroup(input: {
    studentId: string;
    groupId: string | null;
    counselorId?: string;
  }): Promise<void> {
    const row = this.rows.get(input.studentId);
    if (!row) throw new Error("user not found");

    if (row.groupId) {
      const previous = this.state.groupCounts.get(row.groupId) ?? 0;
      this.state.groupCounts.set(row.groupId, Math.max(0, previous - 1));
    }

    row.groupId = input.groupId;
    if (input.counselorId !== undefined) row.counselorId = input.counselorId;

    if (input.groupId) {
      const next = this.state.groupCounts.get(input.groupId) ?? 0;
      this.state.groupCounts.set(input.groupId, next + 1);
    }
  }

  async findPhysicalProfile(id: string): Promise<PhysicalProfile | null> {
    if (!this.rows.has(id)) return null;
    return (
      this.physical.get(id) ?? {
        age: null,
        gender: null,
        heightCm: null,
        weightKg: null,
        activityLevel: null,
        dietGoal: null,
      }
    );
  }

  async updatePhysicalProfile(
    id: string,
    patch: PhysicalProfilePatch,
  ): Promise<PhysicalProfile> {
    if (!this.rows.has(id)) throw new Error("user not found");
    const profile: PhysicalProfile = { ...patch };
    this.physical.set(id, profile);
    return profile;
  }
}

export class FakeSessionRepository implements SessionRepositoryPort {
  private rows: SessionRow[] = [];
  private sequence = 0;

  all(): SessionRow[] {
    return [...this.rows];
  }

  count(): number {
    return this.rows.length;
  }

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.sequence += 1;
    this.rows.push({
      id: `session-${this.sequence}`,
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const row = this.rows.find((item) => item.tokenHash === tokenHash);
    return row
      ? { id: row.id, userId: row.userId, expiresAt: row.expiresAt }
      : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    this.rows = this.rows.filter((row) => row.tokenHash !== tokenHash);
  }

  async deleteManyByUserId(
    userId: string,
    exceptTokenHash?: string,
  ): Promise<void> {
    this.rows = this.rows.filter(
      (row) =>
        row.userId !== userId ||
        (exceptTokenHash !== undefined && row.tokenHash === exceptTokenHash),
    );
  }
}

export class FakeGroupRepository implements GroupRepositoryPort {
  private readonly rows = new Map<string, GroupRow>();
  private sequence = 0;

  constructor(private readonly state: SharedState) {}

  all(): GroupSummary[] {
    return [...this.rows.values()].map((row) => this.toSummary(row));
  }

  count(): number {
    return this.rows.size;
  }

  private toSummary(row: GroupRow): GroupSummary {
    return {
      ...row,
      studentCount: this.state.groupCounts.get(row.id) ?? 0,
    };
  }

  async create(input: NewGroup): Promise<GroupSummary> {
    this.sequence += 1;
    const row: GroupRow = {
      id: `group-${this.sequence}`,
      name: input.name,
      description: input.description,
      targetGrade: input.targetGrade,
      targetField: input.targetField,
      color: input.color ?? "#4A90D9",
      counselorId: input.counselorId,
    };
    this.rows.set(row.id, row);
    this.state.groupNames.set(row.id, row.name);
    return this.toSummary(row);
  }

  async findById(id: string): Promise<GroupSummary | null> {
    const row = this.rows.get(id);
    return row ? this.toSummary(row) : null;
  }

  async listByCounselor(counselorId: string): Promise<GroupSummary[]> {
    return [...this.rows.values()]
      .filter((row) => row.counselorId === counselorId)
      .map((row) => this.toSummary(row));
  }
}

export interface AdvisingFakes {
  users: FakeUserRepository;
  sessions: FakeSessionRepository;
  groups: FakeGroupRepository;
  crypto: FakeAuthCrypto;
}

export function createAdvisingFakes(): AdvisingFakes {
  const state: SharedState = {
    groupNames: new Map<string, string>(),
    groupCounts: new Map<string, number>(),
  };

  return {
    users: new FakeUserRepository(state),
    sessions: new FakeSessionRepository(),
    groups: new FakeGroupRepository(state),
    crypto: new FakeAuthCrypto(),
  };
}
