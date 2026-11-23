/**
 * Composition root for the RAG module.
 *
 * Lazy + cached on globalThis in dev (prevents HMR from duplicating
 * adapters / connections). Everything is wired here; route handlers only
 * call getContainer() and delegate to use cases.
 */

import { ChromaVectorStore } from "@/modules/rag/infrastructure/chroma-vector-store";
import { HybridRetriever } from "@/modules/rag/infrastructure/hybrid-retriever";
import { LLMReranker } from "@/modules/rag/infrastructure/llm-reranker";
import { MemoryCache } from "@/modules/rag/infrastructure/cache";
import { OpenRouterEmbeddingProvider } from "@/modules/rag/infrastructure/openrouter-embedding";
import { OpenRouterLLMProvider } from "@/modules/rag/infrastructure/openrouter-llm";
import { env } from "@/shared/env";
import { PrismaDocumentRepository } from "@/modules/rag/infrastructure/prisma-document-repository";
import { PrismaIngestionRunRepository } from "@/modules/rag/infrastructure/prisma-ingestion-run-repository";
import { PrismaConversationRepository } from "@/modules/rag/infrastructure/prisma-conversation-repository";
import { PrismaMessageRepository } from "@/modules/rag/infrastructure/prisma-message-repository";
import { ChromaHealthProbe } from "@/modules/rag/infrastructure/chroma-health";
import { PostgresHealthProbe } from "@/modules/rag/infrastructure/postgres-health";
import { AskQuestionUseCase } from "@/modules/rag/application/ask-question";
import { IngestDocumentUseCase } from "@/modules/rag/application/ingest-document";
import { SearchKnowledgeUseCase } from "@/modules/rag/application/search-knowledge";
import { ListDocumentsUseCase } from "@/modules/rag/application/list-documents";
import { ManageDocumentsUseCase } from "@/modules/rag/application/manage-documents";
import { ConversationUseCase } from "@/modules/rag/application/conversation";
import { AdminChunksUseCase } from "@/modules/rag/application/admin-chunks";
import { AdminStatsUseCase } from "@/modules/rag/application/admin-stats";
import { TextSplitter } from "@/modules/rag/application/text-splitter";
import type { HealthProbe } from "@/modules/rag/domain/ports";
import {
  LoginUserUseCase,
  LogoutUserUseCase,
  RegisterUserUseCase,
} from "@/modules/advising/application/auth";
import { ResolveSessionUseCase } from "@/modules/advising/application/session";
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
} from "@/modules/advising/application/profile";
import {
  AssignStudentToGroupUseCase,
  CounselorRosterUseCase,
  CreateGroupUseCase,
} from "@/modules/advising/application/groups";
import {
  ListWeeklyScheduleUseCase,
  CreateScheduleEntryUseCase,
  UpdateScheduleEntryUseCase,
  DeleteScheduleEntryUseCase,
} from "@/modules/advising/application/schedule";
import {
  ListHomeworkUseCase,
  CreateHomeworkUseCase,
  SetHomeworkCompletionUseCase,
  DeleteHomeworkUseCase,
} from "@/modules/advising/application/homework";
import {
  RecordStudySessionUseCase,
  GetStudyAnalysisUseCase,
} from "@/modules/advising/application/study";
import {
  PrismaUserRepository,
} from "@/modules/advising/infrastructure/prisma-user-repository";
import { PrismaSessionRepository } from "@/modules/advising/infrastructure/prisma-session-repository";
import { PrismaGroupRepository } from "@/modules/advising/infrastructure/prisma-group-repository";
import { PrismaScheduleRepository } from "@/modules/advising/infrastructure/prisma-schedule-repository";
import { PrismaHomeworkRepository } from "@/modules/advising/infrastructure/prisma-homework-repository";
import { PrismaStudySessionRepository } from "@/modules/advising/infrastructure/prisma-study-session-repository";
import { ScryptAuthCrypto } from "@/modules/advising/infrastructure/auth-crypto";

type Container = {
  healthProbes: {
    postgres: PostgresHealthProbe;
    chroma: ChromaHealthProbe;
  };
  ingestDocument: IngestDocumentUseCase;
  searchKnowledge: SearchKnowledgeUseCase;
  askQuestion: AskQuestionUseCase;
  listDocuments: ListDocumentsUseCase;
  manageDocuments: ManageDocumentsUseCase;
  conversation: ConversationUseCase;
  adminChunks: AdminChunksUseCase;
  adminStats: AdminStatsUseCase;
  advising: {
    registerUser: RegisterUserUseCase;
    loginUser: LoginUserUseCase;
    logoutUser: LogoutUserUseCase;
    resolveSession: ResolveSessionUseCase;
    getProfile: GetProfileUseCase;
    updateProfile: UpdateProfileUseCase;
    createGroup: CreateGroupUseCase;
    assignStudent: AssignStudentToGroupUseCase;
    counselorRoster: CounselorRosterUseCase;
    listWeeklySchedule: ListWeeklyScheduleUseCase;
    createScheduleEntry: CreateScheduleEntryUseCase;
    updateScheduleEntry: UpdateScheduleEntryUseCase;
    deleteScheduleEntry: DeleteScheduleEntryUseCase;
    listHomework: ListHomeworkUseCase;
    createHomework: CreateHomeworkUseCase;
    setHomeworkCompletion: SetHomeworkCompletionUseCase;
    deleteHomework: DeleteHomeworkUseCase;
    recordStudySession: RecordStudySessionUseCase;
    getStudyAnalysis: GetStudyAnalysisUseCase;
  };
};

const globalForContainer = globalThis as unknown as {
  __mrDanContainer?: Container;
  __mrDanContainerVersion?: number;
};

/**
 * Bump when the container's shape changes: the cache lives on `globalThis`
 * across HMR, so adding keys stays invisible to an already-running dev server.
 */
const CONTAINER_VERSION = 2;

function build(): Container {
  const documentRepository = new PrismaDocumentRepository();
  const ingestionRunRepository = new PrismaIngestionRunRepository();
  const conversationRepository = new PrismaConversationRepository();
  const messageRepository = new PrismaMessageRepository();
  const vectorStore = new ChromaVectorStore();
  const embeddingProvider = new OpenRouterEmbeddingProvider();
  const textSplitter = new TextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
  });

  const retriever = new HybridRetriever({
    vectorStore,
    embeddingProvider,
    bm25Weight: env.HYBRID_BM25_WEIGHT,
    rrfK: 60,
  });

  const llm = new OpenRouterLLMProvider();
  const reranker = new LLMReranker(llm);
  const cache = new MemoryCache();

  const ingestDocument = new IngestDocumentUseCase(
    documentRepository,
    vectorStore,
    embeddingProvider,
    textSplitter,
    ingestionRunRepository,
  );

  const searchKnowledge = new SearchKnowledgeUseCase(
    embeddingProvider,
    retriever,
    llm,
  );

  const askQuestion = new AskQuestionUseCase(
    searchKnowledge,
    embeddingProvider,
    retriever,
    reranker,
    llm,
    cache,
  );

  const listDocuments = new ListDocumentsUseCase(documentRepository);
  const manageDocuments = new ManageDocumentsUseCase(documentRepository, vectorStore);
  const conversation = new ConversationUseCase(conversationRepository, messageRepository);
  const adminChunks = new AdminChunksUseCase(vectorStore);
  const adminStats = new AdminStatsUseCase(
    documentRepository,
    vectorStore,
    conversationRepository,
    cache,
    {
      postgres: new PostgresHealthProbe(),
      chroma: new ChromaHealthProbe(),
    },
  );

  return {
    healthProbes: {
      postgres: new PostgresHealthProbe(),
      chroma: new ChromaHealthProbe(),
    },
    ingestDocument,
    searchKnowledge,
    askQuestion,
    listDocuments,
    manageDocuments,
    conversation,
    adminChunks,
    adminStats,
    advising: buildAdvising(),
  };
}

function buildAdvising(): Container["advising"] {
  const users = new PrismaUserRepository();
  const sessions = new PrismaSessionRepository();
  const groups = new PrismaGroupRepository();
  const schedule = new PrismaScheduleRepository();
  const homework = new PrismaHomeworkRepository();
  const study = new PrismaStudySessionRepository();
  const crypto = new ScryptAuthCrypto();

  return {
    registerUser: new RegisterUserUseCase(users, sessions, crypto),
    loginUser: new LoginUserUseCase(users, sessions, crypto),
    logoutUser: new LogoutUserUseCase(sessions, crypto),
    resolveSession: new ResolveSessionUseCase(sessions, users, crypto),
    getProfile: new GetProfileUseCase(users),
    updateProfile: new UpdateProfileUseCase(users, sessions, crypto),
    createGroup: new CreateGroupUseCase(groups),
    assignStudent: new AssignStudentToGroupUseCase(users, groups),
    counselorRoster: new CounselorRosterUseCase(users, groups),
    listWeeklySchedule: new ListWeeklyScheduleUseCase(users, schedule),
    createScheduleEntry: new CreateScheduleEntryUseCase(schedule),
    updateScheduleEntry: new UpdateScheduleEntryUseCase(schedule),
    deleteScheduleEntry: new DeleteScheduleEntryUseCase(schedule),
    listHomework: new ListHomeworkUseCase(users, homework),
    createHomework: new CreateHomeworkUseCase(homework),
    setHomeworkCompletion: new SetHomeworkCompletionUseCase(homework),
    deleteHomework: new DeleteHomeworkUseCase(homework),
    recordStudySession: new RecordStudySessionUseCase(users, study),
    getStudyAnalysis: new GetStudyAnalysisUseCase(users, study),
  };
}

/**
 * Lazy composition root.
 */
export function getContainer(): Container {
  if (
    !globalForContainer.__mrDanContainer ||
    globalForContainer.__mrDanContainerVersion !== CONTAINER_VERSION
  ) {
    globalForContainer.__mrDanContainer = build();
    globalForContainer.__mrDanContainerVersion = CONTAINER_VERSION;
  }
  return globalForContainer.__mrDanContainer;
}

export type { HealthProbe };
