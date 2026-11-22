/**
 * List all ingested documents.
 */

import type { DocumentRecord } from "@/modules/rag/domain/models";
import type { DocumentRepositoryPort } from "@/modules/rag/domain/ports";

export interface ListDocumentsOutput {
  documents: DocumentRecord[];
}

export class ListDocumentsUseCase {
  constructor(private readonly documentRepository: DocumentRepositoryPort) {}

  async execute(): Promise<ListDocumentsOutput> {
    const documents = await this.documentRepository.list();
    return { documents };
  }
}
