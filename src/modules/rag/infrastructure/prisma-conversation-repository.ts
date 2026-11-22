/**
 * Prisma implementation of ConversationRepositoryPort.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { ConversationRepositoryPort } from "@/modules/rag/domain/ports";

export class PrismaConversationRepository
  implements ConversationRepositoryPort
{
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(record: { title: string }) {
    const row = await this.client.conversation.create({
      data: { title: record.title },
      include: { _count: { select: { messages: true } } },
    });
    return {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: row._count.messages,
    };
  }

  async list() {
    const rows = await this.client.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messageCount: row._count.messages,
    }));
  }

  async findById(id: string) {
    const row = await this.client.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messages: row.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: m.sources,
        createdAt: m.createdAt,
      })),
    };
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.client.conversation.update({
      where: { id },
      data: { title },
    });
  }

  async delete(id: string): Promise<void> {
    // Messages cascade-delete via Prisma relation (onDelete: Cascade).
    await this.client.conversation.delete({ where: { id } });
  }
}
