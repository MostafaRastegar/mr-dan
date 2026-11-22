/**
 * Admin chunk read/delete over the vector store port.
 */

import type { Chunk } from "@/modules/rag/domain/models";
import type { VectorStorePort } from "@/modules/rag/domain/ports";

export interface AdminChunksOutput {
  chunks: Chunk[];
}

export class AdminChunksUseCase {
  constructor(private readonly vectorStore: VectorStorePort) {}

  async list(): Promise<AdminChunksOutput> {
    const chunks = await this.vectorStore.getAllChunks();
    return { chunks };
  }

  async delete(id: string): Promise<void> {
    await this.vectorStore.deleteChunk(id);
  }
}
