/**
 * Admin user directory and role-change rails.
 *
 * Reads are gated by the page/action (`user:read`). The role change re-checks
 * `user:manage` here, so the use case never trusts the caller's guard.
 */

import { hasCapability } from "../domain/capabilities";
import {
  ForbiddenError,
  LastAdminError,
  NotFoundError,
  RoleChangeForbiddenError,
  ValidationError,
} from "../domain/errors";
import type { AdminUserRow, Page, Role } from "../domain/models";
import type {
  AdminUsersRepositoryPort,
  AuthCryptoPort,
} from "../domain/ports";
import { clampPage } from "./pagination";
import type { Actor } from "./planning-access";

export class ListUsersUseCase {
  constructor(private readonly users: AdminUsersRepositoryPort) {}

  async execute(input?: {
    page?: number;
    pageSize?: number;
  }): Promise<Page<AdminUserRow>> {
    return this.users.listUsers(clampPage(input));
  }
}

export class ChangeUserRoleUseCase {
  constructor(private readonly users: AdminUsersRepositoryPort) {}

  async execute(input: {
    actor: Actor;
    userId: string;
    role: Role;
  }): Promise<void> {
    if (!hasCapability(input.actor.role, "user:manage")) {
      throw new ForbiddenError();
    }
    if (input.userId === input.actor.id) {
      throw new RoleChangeForbiddenError();
    }

    const target = await this.users.findById(input.userId);
    if (!target) throw new NotFoundError("کاربر");

    if (target.role === "admin" && input.role !== "admin") {
      const admins = await this.users.countAdmins();
      if (admins <= 1) throw new LastAdminError();
    }

    await this.users.updateRole(input.userId, input.role);
  }
}

/**
 * Operator/admin support surface: edit contact fields and reset credentials.
 * Re-checks `user:support`; role changes are unreachable from this path.
 */
export class SupportUserUseCase {
  constructor(
    private readonly users: AdminUsersRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async updateContact(input: {
    actor: Actor;
    userId: string;
    fullName: string;
    email: string | null;
  }): Promise<void> {
    this.assertSupport(input.actor);
    const fullName = input.fullName.trim();
    if (!fullName) throw new ValidationError("نام کامل الزامی است");

    const target = await this.users.findById(input.userId);
    if (!target) throw new NotFoundError("کاربر");

    await this.users.updateProfile(input.userId, {
      fullName,
      email: input.email?.trim() || null,
    });
  }

  /** Returns the plaintext exactly once; only the hash is stored. */
  async resetCredentials(input: {
    actor: Actor;
    userId: string;
  }): Promise<{ temporaryPassword: string }> {
    this.assertSupport(input.actor);

    const target = await this.users.findById(input.userId);
    if (!target) throw new NotFoundError("کاربر");

    const temporaryPassword = this.crypto.generateToken();
    const passwordHash = await this.crypto.hashPassword(temporaryPassword);
    await this.users.resetPasswordHash(input.userId, passwordHash);

    return { temporaryPassword };
  }

  private assertSupport(actor: Actor): void {
    if (!hasCapability(actor.role, "user:support")) throw new ForbiddenError();
  }
}
