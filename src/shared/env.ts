import { z } from "zod";

const bool = (fallback: boolean) =>
  z
    .string()
    .default(String(fallback))
    .transform((value) => value === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z
    .string()
    .default("postgresql://mr_dan:mr_dan@localhost:5432/mr_dan?schema=public"),
  CHROMA_URL: z.string().url().default("http://localhost:8001"),

  OPENROUTER_API_KEY: z.string().default(""),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  EMBEDDING_MODEL: z.string().default("nvidia/nemotron-3.5-embed-8b:free"),
  LLM_MODEL: z.string().default("nvidia/nemotron-3-ultra-550b-a55b:free"),
  LLM_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(120),
  LLM_RETRY_ATTEMPTS: z.coerce.number().int().min(0).default(3),

  CHUNK_SIZE: z.coerce.number().int().positive().default(800),
  CHUNK_OVERLAP: z.coerce.number().int().min(0).default(120),
  TOP_K: z.coerce.number().int().positive().default(5),
  FETCH_K: z.coerce.number().int().positive().default(20),
  RETRIEVAL_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.35),
  RETRIEVAL_LOW_RELEVANCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.45),

  RERANK_ENABLED: bool(true),
  RERANK_TOP_N: z.coerce.number().int().positive().default(5),
  RERANK_MIN_SCORE: z.coerce.number().min(0).max(10).default(3),

  HYBRID_SEARCH_ENABLED: bool(true),
  HYBRID_BM25_WEIGHT: z.coerce.number().min(0).max(1).default(0.4),

  MULTI_QUERY_ENABLED: bool(false),
  MULTI_QUERY_COUNT: z.coerce.number().int().positive().default(3),
  QUERY_EXPANSION_ENABLED: bool(false),
  QUERY_EXPANSION_COUNT: z.coerce.number().int().positive().default(3),
  LOOSE_PROMPT_ENABLED: bool(false),

  CACHE_SEMANTIC_ENABLED: bool(true),
  CACHE_SEMANTIC_THRESHOLD: z.coerce.number().min(0).max(1).default(0.97),
  CACHE_TTL_EMBEDDING: z.coerce.number().int().positive().default(3600),
  CACHE_TTL_LLM: z.coerce.number().int().positive().default(86400),

  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(20),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;

export function assertOpenRouterKey(): string {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return env.OPENROUTER_API_KEY;
}
