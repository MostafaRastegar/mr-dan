/**
 * Domain errors.
 *
 * Infrastructure adapters wrap their underlying errors into one of these
 * (preserving the original as `cause`). Presentation maps them to HTTP.
 *
 * The base kernel lives in `@/shared/errors` so product modules share one
 * `code`/`status` shape; re-exported here to keep existing imports working.
 */

import { AppError, NotFoundError, ValidationError } from "@/shared/errors";

export { AppError, NotFoundError, ValidationError };

export class UnsupportedFileError extends AppError {
  constructor(mime: string, cause?: unknown) {
    super("unsupported_file", 415, `Unsupported file type: ${mime}`, cause);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(maxMB: number, cause?: unknown) {
    super("payload_too_large", 413, `File exceeds ${maxMB} MB limit`, cause);
  }
}

export class DocumentLoadError extends AppError {
  constructor(message: string, cause?: unknown) {
    super("document_load_failed", 422, message, cause);
  }
}

export class EmbeddingError extends AppError {
  constructor(cause?: unknown) {
    super("embedding_failed", 502, "Embedding provider failed", cause);
  }
}

export class VectorStoreError extends AppError {
  constructor(cause?: unknown) {
    super("vector_store_failed", 502, "Vector store failed", cause);
  }
}

export class RetrievalError extends AppError {
  constructor(cause?: unknown) {
    super("retrieval_failed", 500, "Retrieval failed", cause);
  }
}

export class UpstreamError extends AppError {
  constructor(service: string, cause?: unknown) {
    super("upstream_failed", 502, `Upstream failed: ${service}`, cause);
  }
}
