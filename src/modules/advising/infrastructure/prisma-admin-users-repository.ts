/**
 * Prisma implementation of AdminUsersRepositoryPort.
 *
 * Paginated user directory (`createdAt desc`) plus the support mutations:
 * role, contact profile, password hash. Explicit `select`, rows mapped to the
 * ISO-string read model.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import { EmailTakenError, NotFoundError } from "@/modules/advising/domain/errors";
import { toRole } from "@/modules/advising/domain/models";
import type {
  AdminUserRow,
  Page,
  Role,
} from "@/modules/advising/domain/models";
import type {
  AdminUsersRepositoryPort,
  PageQuery,
} from "@/modules/advising/domain/ports";

const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

type AdminUserDbRow = {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  role: string;
  createdAt: Date;
};

function mapUser(row: AdminUserDbRow): AdminUserRow {
  return {
    id: row.id,
    username: row.username,
    fullName: row.fullName,
    email: row.email,
    role: toRole(row.role),
    createdAt: row.createdAt.toISOString(),
  };
}

function isP2025(error: unknown): error is { code: "P2025" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2025"
  );
}

function isP2002(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export class PrismaAdminUsersRepository implements AdminUsersRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async listUsers(query: PageQuery): Promise<Page<AdminUserRow>> {
    const [rows, total] = await Promise.all([
      this.client.user.findMany({
        select: ADMIN_USER_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.client.user.count(),
    ]);
    return {
      items: rows.map(mapUser),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findById(id: string): Promise<AdminUserRow | null> {
    const row = await this.client.user.findUnique({
      where: { id },
      select: ADMIN_USER_SELECT,
    });
    return row ? mapUser(row) : null;
  }

  async countAdmins(): Promise<number> {
    return this.client.user.count({ where: { role: "admin" } });
  }

  async updateRole(userId: string, role: Role): Promise<void> {
    try {
      await this.client.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("کاربر", error);
      throw error;
    }
  }

  async updateProfile(
    userId: string,
    input: { fullName: string; email: string | null },
  ): Promise<void> {
    try {
      await this.client.user.update({
        where: { id: userId },
        data: { fullName: input.fullName, email: input.email },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("کاربر", error);
      if (isP2002(error)) throw new EmailTakenError(error);
      throw error;
    }
  }

  async resetPasswordHash(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.client.user.update({
        where: { id: userId },
        data: { passwordHash },
        select: { id: true },
      });
    } catch (error) {
      if (isP2025(error)) throw new NotFoundError("کاربر", error);
      throw error;
    }
  }
}
