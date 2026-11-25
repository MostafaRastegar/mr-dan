import { Prisma } from "@/generated/prisma/client";
import { PlanConcurrencyError } from "@/modules/advising/domain/errors";

const MAX_ATTEMPTS = 3;

function backoffMs(attempt: number): number {
  return 5 * attempt + Math.random() * 5;
}

type ErrorLike = {
  code?: unknown;
  originalCode?: unknown;
  kind?: unknown;
  name?: unknown;
  cause?: unknown;
};

function isPrismaP2034(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function isSerializationErrorLike(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as ErrorLike;
  if (e.code === "40001" || e.originalCode === "40001") return true;
  if (e.kind === "TransactionWriteConflict" || e.name === "TransactionWriteConflict") return true;
  return false;
}

function isSerializationFailure(error: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (isPrismaP2034(error)) return true;
  if (isSerializationErrorLike(error)) return true;
  if (error instanceof Error) {
    return isSerializationFailure(error.cause, depth + 1);
  }
  if (error && typeof error === "object") {
    const e = error as ErrorLike;
    if (e.cause) return isSerializationFailure(e.cause, depth + 1);
  }
  return false;
}

async function retryOnSerializationFailure<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isSerializationFailure(error)) throw error;
      if (attempt >= MAX_ATTEMPTS) throw new PlanConcurrencyError(error);
      await new Promise((resolve) => setTimeout(resolve, backoffMs(attempt)));
    }
  }
}

export { retryOnSerializationFailure };
