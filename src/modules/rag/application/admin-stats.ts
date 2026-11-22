/**
 * Admin system stats: document/chunk/conversation counts, cache size,
 * upstream dependency health.
 */

import type { RAGCachePort } from "@/modules/rag/domain/ports";
import type {
  ConversationRepositoryPort,
  DocumentRepositoryPort,
  VectorStorePort,
} from "@/modules/rag/domain/ports";
import type { HealthProbe } from "@/modules/rag/domain/ports";

export interface AdminStatsOutput {
  documents: number;
  chunks: number;
  conversations: number;
  cache: { exact: number; semantic: number };
  upstream: Record<string, "ok" | "unavailable">;
}

export class AdminStatsUseCase {
  constructor(
    private readonly documentRepository: DocumentRepositoryPort,
    private readonly vectorStore: VectorStorePort,
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly cache: RAGCachePort,
    private readonly healthProbes: Record<string, HealthProbe>,
  ) {}

  async execute(): Promise<AdminStatsOutput> {
    const [documents, conversations, cache] = await Promise.all([
      this.documentRepository.list().then((d) => d.length),
      this.conversationRepository.list().then((c) => c.length),
      this.cache.size(),
    ]);

    // Chroma may be unavailable; stats still report what Postgres/cache know.
    const chunks = await this.vectorStore.count().catch(() => 0);

    const upstream: Record<string, "ok" | "unavailable"> = {};
    await Promise.all(
      Object.entries(this.healthProbes).map(async ([name, probe]) => {
        try {
          await probe.check();
          upstream[name] = "ok";
        } catch {
          upstream[name] = "unavailable";
        }
      }),
    );

    return {
      documents,
      chunks,
      conversations,
      cache,
      upstream,
    };
  }
}
