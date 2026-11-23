---
name: mr-dan-devops
description: Environment validation, Docker Compose, CI, logging, and metrics for mr-dan
---

# mr-dan-devops

## Usage

Use when changing env handling, Docker, CI, logging, metrics, or local setup.

## Env

- The only place `process.env` is read: `src/shared/env.ts`, validated with zod.
- Validated at boot; a missing variable is an explicit error, never `undefined` deep in the code.
- `.env.example` is complete and secret-free.
- Secrets: `.env` and `.env.oracle` stay in `.gitignore`.
- Split by concern: `DATABASE_URL`, `CHROMA_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `EMBEDDING_MODEL`, `LLM_MODEL`, `MAX_UPLOAD_MB`, `LOG_LEVEL`.

## Docker Compose

```yaml
services:
  postgres:  image: postgres:17      # pg_isready healthcheck, volume
  chromadb:  image: chromadb/chroma  # healthcheck on 8000 inside the container; host 8001 because 8000 belongs to the oracle
  app:       build: .                # profile: full, port 3000
```

- `depends_on: condition: service_healthy` for the app.
- Chroma runs with `IS_PERSISTENT=TRUE` and a volume.
- The app uses a bind mount in dev; in production `output: "standalone"`.
- No default password in compose; read from `.env`.

## CI

```text
1. pnpm install --frozen-lockfile
2. pnpm typecheck
3. pnpm lint
4. pnpm test
5. pnpm build
6. (optional) docker compose up + integration
```

- Cache the pnpm store.
- Fail fast on lint/type errors.
- No test that needs the real OpenRouter runs in the default CI job.

## Logging

- pino: JSON in production, pretty in dev.
- Fixed fields: `requestId`, `route`, `durationMs`, `cache`, `topK`, `errorCode`.
- Never log: API keys, full document text, embeddings, user content.
- Errors are logged with `cause`, but the user response carries only a code and a short message.

## Metrics

`GET /api/metrics` in Prometheus format:

```text
mrdan_requests_total{route,status}
mrdan_request_duration_seconds{route}
mrdan_retrieval_duration_seconds
mrdan_cache_hits_total{layer}
mrdan_llm_errors_total{kind}
mrdan_chunks_total
```

- No high-cardinality labels (user question, id).
- Health is separate from metrics.

## Checklist

- [ ] Env is validated at boot.
- [ ] `docker compose up` works from a clean checkout.
- [ ] Health actually checks dependencies, not a static `{ok:true}`.
- [ ] CI runs on pull requests.
- [ ] Logs contain no secrets.
- [ ] Metrics have no risky labels.

## Anti-patterns

- `process.env.X!` scattered through the code.
- A health endpoint that only returns `200`.
- Compose with hard-coded passwords.
- Logging the whole prompt in production.
- Metrics labeled with `question`.
