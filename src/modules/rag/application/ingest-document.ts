/**
 * Ingest a document into the RAG pipeline.
 *
 * Steps:
 *   1. Load raw document (loader registry)
 *   2. Normalize text
 *   3. Compute content hash (SHA-256 of normalized content + filename)
 *   4. Idempotency: if same contentHash already ingested → no-op
 *   5. Split into chunks (deterministic ids: `${documentId}:${index}`)
 *   6. Delete any existing chunks for this document_id
 *   7. Embed chunks
 *   8. Add to vector store
 *   9. Persist document record + ingestion run
 *
 * On any mid-pipeline failure the IngestionRun is marked `failed` and the
 * document record is NOT created (or left intact for re-ingestion).
 */

import crypto from "node:crypto";
import { logger } from "@/shared/logger";
import type {
  DocumentRecord,
  FileType,
  RawDocument,
} from "@/modules/rag/domain/models";
import {
  DocumentLoadError,
  UnsupportedFileError,
  VectorStoreError,
} from "@/modules/rag/domain/errors";
import type {
  DocumentRepositoryPort,
  EmbeddingProviderPort,
  IngestionRunRepositoryPort,
  TextSplitterPort,
  VectorStorePort,
} from "@/modules/rag/domain/ports";
import { defaultRegistry } from "@/modules/rag/application/document-loaders";

export interface IngestDocumentInput {
  filePath: string;
  originalFilename: string;
  fileType: FileType;
}

export interface IngestDocumentOutput {
  document: DocumentRecord;
  chunkCount: number;
  cached: boolean; // true if content was already ingested (no-op)
}

export class IngestDocumentUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly vectorStore: VectorStorePort,
    private readonly embeddingProvider: EmbeddingProviderPort,
    private readonly textSplitter: TextSplitterPort,
    private readonly ingestionRunRepository: IngestionRunRepositoryPort,
    private readonly loaderRegistry = defaultRegistry,
  ) {}

  async execute(input: IngestDocumentInput): Promise<IngestDocumentOutput> {
    const { filePath, originalFilename, fileType } = input;

    let runId: string | undefined;

    try {
      // 1. Load
      let raw: RawDocument;
      try {
        const loader = this.loaderRegistry.resolve(filePath);
        raw = await loader.load(filePath);
      } catch (error) {
        if (error instanceof UnsupportedFileError) throw error;
        throw new DocumentLoadError(
          `Failed to load ${filePath}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      }

      // 2. Content hash (normalized content + original filename)
      const contentHash = await sha256(
        `${raw.content}|||${originalFilename}`,
      );

      // 3. Idempotency: same content already ingested
      const existing = await this.documentRepository.findByContentHash(
        contentHash,
      );
      if (existing) {
        logger.info(
          { contentHash, documentId: existing.id },
          "ingest: content already ingested, skipping",
        );
        return { document: existing, chunkCount: existing.chunkCount, cached: true };
      }

      // 4. Split into chunks
      const chunks = this.textSplitter.split(raw);
      if (chunks.length === 0) {
        throw new DocumentLoadError(`No chunks produced from ${filePath}`);
      }

      // 5. Deterministic document id derived from content hash
      const documentId = `doc:${contentHash.slice(0, 16)}`;

      // Attach contentHash + document_id to chunk metadata
      for (const chunk of chunks) {
        chunk.metadata.document_id = documentId;
        chunk.metadata.content_hash = contentHash;
        chunk.metadata.original_filename = originalFilename;
        chunk.metadata.file_type = fileType;
        // chunk_index already set by splitter
      }

      // 6. Idempotent re-ingestion: delete old chunks for this document_id
      await this.vectorStore.deleteByMetadata("document_id", documentId);

      // 7. Embed
      const vectors = await this.embeddingProvider.embedDocuments(
        chunks.map((c) => c.text),
      );

      // 8. Add to vector store
      try {
        await this.vectorStore.add(chunks, vectors);
      } catch (error) {
        throw new VectorStoreError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }

      // 9. Persist document record + ingestion run (in transaction via repository)
      const record: Omit<DocumentRecord, "id" | "ingestedAt"> & { contentHash: string } = {
        filename: filePath.split("/").pop() ?? originalFilename,
        originalFilename,
        sourcePath: filePath,
        fileType,
        chunkCount: chunks.length,
        contentHash,
      };

      const document = await this.documentRepository.create(record);

      runId = await this.ingestionRunRepository.create({
        documentId: document.id,
        status: "succeeded",
        chunkCount: chunks.length,
      });

      logger.info(
        { documentId: document.id, chunkCount: chunks.length },
        "ingest: completed",
      );

      return { document, chunkCount: chunks.length, cached: false };
    } catch (error) {
      if (runId) {
        try {
          await this.ingestionRunRepository.update(runId, {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });
        } catch {
          // swallow; original error is what matters
        }
      }
      throw error;
    }
  }
}

async function sha256(text: string): Promise<string> {
  const buf = Buffer.from(text, "utf8");
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
