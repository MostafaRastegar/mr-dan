/**
 * Prisma implementation of MessageRepositoryPort.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { MessageRepositoryPort } from "@/modules/rag/domain/ports";

export class PrismaMessageRepository implements MessageRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(record: {
    conversationId: string;
    role: string;
    content: string;
    sources?: unknown;
  }) {
    const row = await this.client.message.create({
      data: {
        conversationId: record.conversationId,
        role: record.role,
        content: record.content,
        sources: record.sources ?? undefined,
      },
    });
    return {
      id: row.id,
      conversationId: row.conversationId,
      role: row.role,
      content: row.content,
      sources: row.sources,
      createdAt: row.createdAt,
    };
  }
}
