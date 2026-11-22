/**
 * Manage ingested documents.
 *
 * Delete follows the data rule: Chroma first, then Postgres. If Chroma
 * deletion succeeds but Postgres fails, the document record remains and the
 * orphaned chunks are already gone (re-ingestion would re-add them).
 */

import { logger } from "@/shared/logger";
import type { DocumentRecord } from "@/modules/rag/domain/models";
import type {
  DocumentRepositoryPort,
  VectorStorePort,
} from "@/modules/rag/domain/ports";

export interface ManageDocumentsInput {
  documentId: string;
}

export interface ManageDocumentsOutput {
  document: DocumentRecord | null;
  chunksDeleted: boolean;
}

export class ManageDocumentsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly vectorStore: VectorStorePort,
  ) {}

  async get(documentId: string): Promise<DocumentRecord | null> {
    return this.documentRepository.findById(documentId);
  }

  async delete(input: ManageDocumentsInput): Promise<ManageDocumentsOutput> {
    const { documentId } = input;

    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      return { document: null, chunksDeleted: false };
    }

    // 1. Chroma first: drop all chunks for this document_id.
    let chunksDeleted = false;
    try {
      await this.vectorStore.deleteByMetadata("document_id", documentId);
      chunksDeleted = true;
      logger.info(
        { documentId },
        "manage-documents: chroma chunks deleted",
      );
    } catch (error) {
      logger.warn(
        { err: error, documentId },
        "manage-documents: chroma delete failed",
      );
    }

    // 2. Postgres second: drop the document record.
    await this.documentRepository.delete(documentId);

    return { document, chunksDeleted };
  }
}
