/**
 * Composition root for the RAG module.
 *
 * Lazy + cached on globalThis in dev (prevents HMR from duplicating
 * adapters / connections). Everything is wired here; route handlers only
 * call getContainer() and delegate to use cases.
 */

import { ChromaVectorStore } from "@/modules/rag/infrastructure/chroma-vector-store";
import { OpenRouterEmbeddingProvider } from "@/modules/rag/infrastructure/openrouter-embedding";
import { PrismaDocumentRepository } from "@/modules/rag/infrastructure/prisma-document-repository";
import { PrismaIngestionRunRepository } from "@/modules/rag/infrastructure/prisma-ingestion-run-repository";
import { ChromaHealthProbe } from "@/modules/rag/infrastructure/chroma-health";
import { PostgresHealthProbe } from "@/modules/rag/infrastructure/postgres-health";
import { IngestDocumentUseCase } from "@/modules/rag/application/ingest-document";
import { SearchKnowledgeUseCase } from "@/modules/rag/application/search-knowledge";
import { TextSplitter } from "@/modules/rag/application/text-splitter";
import type { HealthProbe } from "@/modules/rag/domain/ports";

type Container = {
  healthProbes: {
    postgres: PostgresHealthProbe;
    chroma: ChromaHealthProbe;
  };
  ingestDocument: IngestDocumentUseCase;
  searchKnowledge: SearchKnowledgeUseCase;
};

const globalForContainer = globalThis as unknown as {
  __mrDanContainer?: Container;
};

function build(): Container {
  const documentRepository = new PrismaDocumentRepository();
  const ingestionRunRepository = new PrismaIngestionRunRepository();
  const vectorStore = new ChromaVectorStore();
  const embeddingProvider = new OpenRouterEmbeddingProvider();
  const textSplitter = new TextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });

  const ingestDocument = new IngestDocumentUseCase(
    documentRepository,
    vectorStore,
    embeddingProvider,
    textSplitter,
    ingestionRunRepository,
  );

  const searchKnowledge = new SearchKnowledgeUseCase(
    embeddingProvider,
    vectorStore,
  );

  return {
    healthProbes: {
      postgres: new PostgresHealthProbe(),
      chroma: new ChromaHealthProbe(),
    },
    ingestDocument,
    searchKnowledge,
  };
}

/**
 * Lazy composition root.
 */
export function getContainer(): Container {
  if (!globalForContainer.__mrDanContainer) {
    globalForContainer.__mrDanContainer = build();
  }
  return globalForContainer.__mrDanContainer;
}

export type { HealthProbe };
