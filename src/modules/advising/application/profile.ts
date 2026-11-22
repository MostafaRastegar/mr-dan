/**
 * Profile read/update, including password change.
 *
 * A password change verifies the current password before writing anything,
 * then revokes every other session and keeps the current one alive.
 */

import { UnauthorizedError, ValidationError } from "../domain/errors";
import type { ProfileView, UserAccount } from "../domain/models";
import type {
  AuthCryptoPort,
  SessionRepositoryPort,
  UserRepositoryPort,
} from "../domain/ports";

export class GetProfileUseCase {
  constructor(private readonly users: UserRepositoryPort) {}

  execute(input: { userId: string }): Promise<ProfileView | null> {
    return this.users.findProfileById(input.userId);
  }
}

export type UpdateProfileInput = {
  userId: string;
  token: string;
  fullName: string;
  email?: string;
  grade?: string;
  fieldOfStudy?: string;
  schoolName?: string;
  currentPassword?: string;
  newPassword?: string;
};

function normalizeOptional(value?: string): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export class UpdateProfileUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async execute(input: UpdateProfileInput): Promise<UserAccount> {
    const existing = await this.users.findById(input.userId);
    if (!existing) throw new UnauthorizedError();

    let nextPasswordHash: string | null = null;
    if (input.newPassword) {
      if (!input.currentPassword) {
        throw new ValidationError("رمز عبور فعلی الزامی است");
      }
      const credentials = await this.users.findCredentialsByUsername(
        existing.username,
      );
      const currentMatches = credentials
        ? await this.crypto.verifyPassword(
            input.currentPassword,
            credentials.passwordHash,
          )
        : false;
      if (!currentMatches) throw new UnauthorizedError();

      nextPasswordHash = await this.crypto.hashPassword(input.newPassword);
    }

    const updated = await this.users.updateProfile(input.userId, {
      fullName: input.fullName.trim(),
      email: normalizeOptional(input.email)?.toLowerCase() ?? null,
      grade: normalizeOptional(input.grade),
      fieldOfStudy: normalizeOptional(input.fieldOfStudy),
      schoolName: normalizeOptional(input.schoolName),
    });

    if (nextPasswordHash) {
      await this.users.updatePassword(input.userId, nextPasswordHash);
      await this.sessions.deleteManyByUserId(
        input.userId,
        this.crypto.hashToken(input.token),
      );
    }

    return updated;
  }
}
