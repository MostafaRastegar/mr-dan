/**
 * Prisma implementation of SessionRepositoryPort.
 *
 * Cookie carries the raw token; only sha256(token) is ever persisted, so a DB
 * leak cannot be replayed as a cookie. Deletes use deleteMany to stay
 * idempotent for logout and replay.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { SessionRecord } from "@/modules/advising/domain/models";
import type { SessionRepositoryPort } from "@/modules/advising/domain/ports";

export class PrismaSessionRepository implements SessionRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.client.session.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const row = await this.client.session.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });
    return row
      ? { id: row.id, userId: row.userId, expiresAt: row.expiresAt }
      : null;
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    await this.client.session.deleteMany({ where: { tokenHash } });
  }

  async deleteManyByUserId(
    userId: string,
    exceptTokenHash?: string,
  ): Promise<void> {
    await this.client.session.deleteMany({
      where: {
        userId,
        ...(exceptTokenHash ? { tokenHash: { not: exceptTokenHash } } : {}),
      },
    });
  }
}
