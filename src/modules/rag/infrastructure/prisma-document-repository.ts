/**
 * Prisma implementation of DocumentRepositoryPort.
 */

import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/shared/prisma";
import type { DocumentRecord, FileType } from "@/modules/rag/domain/models";
import type { DocumentRepositoryPort } from "@/modules/rag/domain/ports";

export class PrismaDocumentRepository implements DocumentRepositoryPort {
  constructor(private readonly client: PrismaClient = prisma) {}

  async findByContentHash(contentHash: string): Promise<DocumentRecord | null> {
    const row = await this.client.document.findUnique({
      where: { contentHash },
    });
    return row ? mapDocument(row) : null;
  }

  async findById(id: string): Promise<DocumentRecord | null> {
    const row = await this.client.document.findUnique({ where: { id } });
    return row ? mapDocument(row) : null;
  }

  async list(): Promise<DocumentRecord[]> {
    const rows = await this.client.document.findMany({
      orderBy: { ingestedAt: "desc" },
    });
    return rows.map(mapDocument);
  }

  async create(record: Omit<DocumentRecord, "id" | "ingestedAt"> & { contentHash: string }): Promise<DocumentRecord> {
    const row = await this.client.document.create({
      data: {
        filename: record.filename,
        originalFilename: record.originalFilename,
        sourcePath: record.sourcePath,
        fileType: record.fileType,
        contentHash: record.contentHash,
        chunkCount: record.chunkCount,
      },
    });
    return mapDocument(row);
  }

  async delete(id: string): Promise<void> {
    await this.client.document.delete({ where: { id } });
  }
}

function mapDocument(row: Record<string, unknown>): DocumentRecord {
  return {
    id: String(row.id),
    filename: String(row.filename),
    originalFilename: String(row.originalFilename),
    sourcePath: String(row.sourcePath),
    fileType: String(row.fileType) as FileType,
    chunkCount: Number(row.chunkCount),
    ingestedAt: new Date(String(row.ingestedAt)),
  };
}
