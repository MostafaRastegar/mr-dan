/**
 * Registration, login and logout.
 *
 * Passwords are hashed by the injected AuthCryptoPort; the raw session token
 * only ever leaves this class in the return value (the caller writes it to an
 * httpOnly cookie). The DB stores `hashToken(token)`.
 */

import {
  EmailTakenError,
  UnauthorizedError,
  UsernameTakenError,
} from "../domain/errors";
import type { Role, UserAccount } from "../domain/models";
import type {
  AuthCryptoPort,
  SessionRepositoryPort,
  UserRepositoryPort,
} from "../domain/ports";
import { sessionExpiry } from "./session";

export type RegisterInput = {
  username: string;
  password: string;
  role: Role;
  fullName: string;
  email?: string;
  grade?: string;
  fieldOfStudy?: string;
  schoolName?: string;
};

function normalizeIdentity(value?: string): string | null {
  const trimmed = value?.trim().toLowerCase() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async execute(
    input: RegisterInput,
  ): Promise<{ user: UserAccount; token: string }> {
    const username = input.username.trim().toLowerCase();
    const email = normalizeIdentity(input.email);

    if (email && (await this.users.findByEmail(email))) {
      throw new EmailTakenError();
    }
    if (await this.users.findCredentialsByUsername(username)) {
      throw new UsernameTakenError();
    }

    const passwordHash = await this.crypto.hashPassword(input.password);
    const user = await this.users.create({
      username,
      email,
      role: input.role,
      fullName: input.fullName.trim(),
      grade: input.grade?.trim() || null,
      fieldOfStudy: input.fieldOfStudy?.trim() || null,
      schoolName: input.schoolName?.trim() || null,
      groupId: null,
      counselorId: null,
      passwordHash,
    });

    const token = this.crypto.generateToken();
    await this.sessions.create({
      userId: user.id,
      tokenHash: this.crypto.hashToken(token),
      expiresAt: sessionExpiry(),
    });

    return { user, token };
  }
}

export class LoginUserUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly sessions: SessionRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async execute(input: {
    username: string;
    password: string;
  }): Promise<{ user: UserAccount; token: string }> {
    const found = await this.users.findCredentialsByUsername(
      input.username.trim().toLowerCase(),
    );
    const passwordMatches = found
      ? await this.crypto.verifyPassword(input.password, found.passwordHash)
      : false;

    if (!found || !passwordMatches) {
      // Same error for unknown user and wrong password: no user enumeration.
      throw new UnauthorizedError();
    }

    const token = this.crypto.generateToken();
    await this.sessions.create({
      userId: found.user.id,
      tokenHash: this.crypto.hashToken(token),
      expiresAt: sessionExpiry(),
    });

    return { user: found.user, token };
  }
}

export class LogoutUserUseCase {
  constructor(
    private readonly sessions: SessionRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async execute(input: { token: string }): Promise<void> {
    await this.sessions.deleteByTokenHash(this.crypto.hashToken(input.token));
  }
}
