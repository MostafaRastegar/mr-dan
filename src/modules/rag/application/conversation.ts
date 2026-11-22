/**
 * Conversation CRUD use case.
 *
 * Wraps ConversationRepositoryPort and MessageRepositoryPort. Titles default
 * to the first user message text when none is provided.
 */

import type {
  ConversationRepositoryPort,
  MessageRepositoryPort,
} from "@/modules/rag/domain/ports";

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ConversationDetail {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sources: unknown;
    createdAt: Date;
  }>;
}

export interface CreateConversationInput {
  title?: string;
}

export interface AddMessageInput {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: unknown;
}

export interface UpdateConversationInput {
  title: string;
}

export class ConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepositoryPort,
    private readonly messageRepository: MessageRepositoryPort,
  ) {}

  async create(input: CreateConversationInput = {}): Promise<ConversationSummary> {
    const title = input.title ?? "New conversation";
    return this.conversationRepository.create({ title });
  }

  async list(): Promise<ConversationSummary[]> {
    return this.conversationRepository.list();
  }

  async get(id: string): Promise<ConversationDetail | null> {
    return this.conversationRepository.findById(id);
  }

  async updateTitle(id: string, input: UpdateConversationInput): Promise<void> {
    await this.conversationRepository.updateTitle(id, input.title);
  }

  async delete(id: string): Promise<void> {
    await this.conversationRepository.delete(id);
  }

  async addMessage(input: AddMessageInput): Promise<void> {
    await this.messageRepository.create({
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      sources: input.sources,
    });
  }
}
