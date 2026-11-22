/**
 * Prisma implementation of IngestionRunRepositoryPort.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { IngestionRunRepositoryPort } from "@/modules/rag/domain/ports";

export class PrismaIngestionRunRepository implements IngestionRunRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async create(run: {
    documentId?: string;
    status: "started" | "succeeded" | "failed";
    chunkCount: number;
    error?: string;
  }): Promise<string> {
    const row = await this.client.ingestionRun.create({
      data: {
        documentId: run.documentId ?? null,
        status: run.status,
        chunkCount: run.chunkCount,
        error: run.error ?? null,
      },
    });
    return row.id;
  }

  async update(
    id: string,
    patch: Partial<{ status: string; chunkCount: number; error: string }>,
  ): Promise<void> {
    await this.client.ingestionRun.update({
      where: { id },
      data: {
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.chunkCount !== undefined && { chunkCount: patch.chunkCount }),
        ...(patch.error !== undefined && { error: patch.error }),
        ...(patch.status !== undefined || patch.error !== undefined
          ? { finishedAt: new Date() }
          : {}),
      },
    });
  }
}
