/**
 * Session lifecycle.
 *
 * One source for the 7-day TTL: the cookie layer re-exports `SESSION_TTL_MS`
 * so the DB row and the cookie can never drift. Resolution deletes an expired
 * row lazily (no scheduler in this phase).
 */

import type { UserAccount } from "../domain/models";
import type {
  AuthCryptoPort,
  SessionRepositoryPort,
  UserRepositoryPort,
} from "../domain/ports";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function sessionExpiry(now: number = Date.now()): Date {
  return new Date(now + SESSION_TTL_MS);
}

export class ResolveSessionUseCase {
  constructor(
    private readonly sessions: SessionRepositoryPort,
    private readonly users: UserRepositoryPort,
    private readonly crypto: AuthCryptoPort,
  ) {}

  async execute(input: { token: string }): Promise<{ user: UserAccount } | null> {
    const token = input.token.trim();
    if (!token) return null;

    const tokenHash = this.crypto.hashToken(token);
    const record = await this.sessions.findByTokenHash(tokenHash);
    if (!record) return null;

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.sessions.deleteByTokenHash(tokenHash);
      return null;
    }

    const user = await this.users.findById(record.userId);
    return user ? { user } : null;
  }
}
