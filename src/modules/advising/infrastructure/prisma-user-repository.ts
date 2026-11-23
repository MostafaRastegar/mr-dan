/**
 * Prisma implementation of UserRepositoryPort.
 *
 * Explicit `select` on every query, rows mapped to domain models, and unique
 * violations (P2002) remapped to domain errors. The Prisma error class is not
 * imported: its generator path is unstable in Prisma 7, so the guard is
 * structural.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type {
  NewUser,
  PhysicalProfile,
  PhysicalProfilePatch,
  ProfilePatch,
  ProfileView,
  StudentSummary,
  UserAccount,
} from "@/modules/advising/domain/models";
import { toRole } from "@/modules/advising/domain/models";
import {
  ACTIVITY_LEVELS,
  DIET_GOALS,
  type ActivityLevel,
  type DietGoal,
  type Gender,
} from "@/modules/advising/domain/energy";
import type { UserRepositoryPort } from "@/modules/advising/domain/ports";
import { EmailTakenError, UsernameTakenError } from "@/modules/advising/domain/errors";

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  fullName: true,
  grade: true,
  fieldOfStudy: true,
  schoolName: true,
  groupId: true,
  counselorId: true,
  createdAt: true,
} as const;

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  role: string;
  fullName: string;
  grade: string | null;
  fieldOfStudy: string | null;
  schoolName: string | null;
  groupId: string | null;
  counselorId: string | null;
  createdAt: Date;
};

const PHYSICAL_SELECT = {
  id: true,
  age: true,
  gender: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  dietGoal: true,
} as const;

type PhysicalRow = {
  id: string;
  age: number | null;
  gender: string | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: string | null;
  dietGoal: string | null;
};

function isGender(value: string | null): value is Gender {
  return value === "male" || value === "female";
}

function isActivityLevel(value: string | null): value is ActivityLevel {
  return ACTIVITY_LEVELS.some((level) => level === value);
}

function isDietGoal(value: string | null): value is DietGoal {
  return DIET_GOALS.some((goal) => goal === value);
}

function mapPhysical(row: PhysicalRow): PhysicalProfile {
  return {
    age: row.age,
    gender: isGender(row.gender) ? row.gender : null,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    activityLevel: isActivityLevel(row.activityLevel) ? row.activityLevel : null,
    dietGoal: isDietGoal(row.dietGoal) ? row.dietGoal : null,
  };
}

function mapUser(row: UserRow): UserAccount {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: toRole(row.role),
    fullName: row.fullName,
    grade: row.grade,
    fieldOfStudy: row.fieldOfStudy,
    schoolName: row.schoolName,
    groupId: row.groupId,
    counselorId: row.counselorId,
    createdAt: row.createdAt,
  };
}

function isUniqueViolation(
  error: unknown,
): error is { code: "P2002"; meta?: { target?: unknown } } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

/**
 * Prisma 7 with a driver adapter reports the violated index under
 * `meta.driverAdapterError.cause.constraint.index`; older engines use
 * `meta.target`. Read both so a duplicate email is not misread as a username.
 */
function uniqueTarget(error: { meta?: { target?: unknown } }): string {
  const meta = error.meta as
    | {
        target?: unknown;
        driverAdapterError?: { cause?: { constraint?: { index?: string } } };
      }
    | undefined;
  const target = meta?.target;
  if (Array.isArray(target)) return target.map(String).join(",");
  if (typeof target === "string") return target;
  return meta?.driverAdapterError?.cause?.constraint?.index ?? "";
}

function mapUniqueViolation(error: unknown): never {
  if (isUniqueViolation(error) && uniqueTarget(error).includes("email")) {
    throw new EmailTakenError(error);
  }
  throw new UsernameTakenError(error);
}

export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findCredentialsByUsername(
    username: string,
  ): Promise<{ user: UserAccount; passwordHash: string } | null> {
    const row = await this.client.user.findUnique({
      where: { username },
      select: { ...USER_SELECT, passwordHash: true },
    });
    if (!row) return null;
    const { passwordHash, ...userRow } = row;
    return { user: mapUser(userRow), passwordHash };
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const row = await this.client.user.findUnique({
      where: { email },
      select: USER_SELECT,
    });
    return row ? mapUser(row) : null;
  }

  async findById(id: string): Promise<UserAccount | null> {
    const row = await this.client.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    return row ? mapUser(row) : null;
  }

  async findProfileById(id: string): Promise<ProfileView | null> {
    const row = await this.client.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        group: { select: { name: true } },
        counselor: { select: { fullName: true } },
      },
    });
    if (!row) return null;
    const { group, counselor, ...userRow } = row;
    return {
      ...mapUser(userRow),
      groupName: group?.name ?? null,
      counselorName: counselor?.fullName ?? null,
    };
  }

  async create(input: NewUser & { passwordHash: string }): Promise<UserAccount> {
    try {
      const row = await this.client.user.create({
        data: {
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          fullName: input.fullName,
          grade: input.grade,
          fieldOfStudy: input.fieldOfStudy,
          schoolName: input.schoolName,
          groupId: input.groupId,
          counselorId: input.counselorId,
        },
        select: USER_SELECT,
      });
      return mapUser(row);
    } catch (error) {
      throw mapUniqueViolation(error);
    }
  }

  async updateProfile(id: string, patch: ProfilePatch): Promise<UserAccount> {
    try {
      const row = await this.client.user.update({
        where: { id },
        data: {
          fullName: patch.fullName,
          email: patch.email,
          grade: patch.grade,
          fieldOfStudy: patch.fieldOfStudy,
          schoolName: patch.schoolName,
        },
        select: USER_SELECT,
      });
      return mapUser(row);
    } catch (error) {
      if (isUniqueViolation(error)) throw mapUniqueViolation(error);
      throw error;
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.client.user.update({
      where: { id },
      data: { passwordHash },
      select: { id: true },
    });
  }

  async listAssignableStudents(counselorId: string): Promise<StudentSummary[]> {
    const rows = await this.client.user.findMany({
      where: {
        role: "student",
        OR: [{ counselorId }, { counselorId: null }],
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        grade: true,
        fieldOfStudy: true,
        schoolName: true,
        groupId: true,
        group: { select: { name: true } },
      },
      orderBy: { fullName: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullName: row.fullName,
      grade: row.grade,
      fieldOfStudy: row.fieldOfStudy,
      schoolName: row.schoolName,
      groupId: row.groupId,
      groupName: row.group?.name ?? null,
    }));
  }

  async assignToGroup(input: {
    studentId: string;
    groupId: string | null;
    counselorId?: string;
  }): Promise<void> {
    await this.client.user.update({
      where: { id: input.studentId },
      data: {
        groupId: input.groupId,
        ...(input.counselorId === undefined
          ? {}
          : { counselorId: input.counselorId }),
      },
      select: { id: true },
    });
  }

  async findPhysicalProfile(id: string): Promise<PhysicalProfile | null> {
    const row = await this.client.user.findUnique({
      where: { id },
      select: PHYSICAL_SELECT,
    });
    return row ? mapPhysical(row) : null;
  }

  async updatePhysicalProfile(
    id: string,
    patch: PhysicalProfilePatch,
  ): Promise<PhysicalProfile> {
    const row = await this.client.user.update({
      where: { id },
      data: { ...patch },
      select: PHYSICAL_SELECT,
    });
    return mapPhysical(row);
  }
}
