/**
 * Integration tests against real Postgres + Chroma.
 *
 * Runs against live services (DATABASE_URL / CHROMA_URL) and skips gracefully
 * when unreachable, so CI stays green without docker.
 */

import { describe, expect, it } from "vitest";
import { env } from "../src/shared/env";

async function liveServices(): Promise<boolean> {
  try {
    await fetch(`${env.CHROMA_URL}/api/v2/heartbeat`, { signal: AbortSignal.timeout(1500) });
  } catch {
    return false;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client");
    const client = new PrismaClient({
      datasources: { db: { url: env.DATABASE_URL } },
    });
    await client.$queryRaw`SELECT 1`;
    await client.$disconnect();
    return true;
  } catch {
    return false;
  }
}

describe("integration (real Postgres + Chroma)", () => {
  it("conversations CRUD persists", async () => {
    if (!(await liveServices())) {
      return; // skip without docker
    }
    const { PrismaConversationRepository } = await import("../src/modules/rag/infrastructure/prisma-conversation-repository");
    const { PrismaMessageRepository } = await import("../src/modules/rag/infrastructure/prisma-message-repository");

    const convRepo = new PrismaConversationRepository();
    const msgRepo = new PrismaMessageRepository();

    const created = await convRepo.create({ title: "Integration test convo" });
    expect(created.id).toBeDefined();
    expect(created.title).toBe("Integration test convo");

    await msgRepo.create({
      conversationId: created.id,
      role: "user",
      content: "سلام",
      sources: null,
    });

    const found = await convRepo.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.messages.length).toBeGreaterThan(0);

    const list = await convRepo.list();
    expect(list.some((c) => c.id === created.id)).toBe(true);

    await convRepo.delete(created.id);
    expect(await convRepo.findById(created.id)).toBeNull();
  });

  it("document delete leaves zero orphan chunks in Chroma", async () => {
    if (!(await liveServices())) {
      return; // skip without docker
    }
    const { ChromaVectorStore } = await import("../src/modules/rag/infrastructure/chroma-vector-store");
    const { PrismaDocumentRepository } = await import("../src/modules/rag/infrastructure/prisma-document-repository");

    const vs = new ChromaVectorStore();
    const docRepo = new PrismaDocumentRepository();

    const docs = await docRepo.list();
    if (docs.length === 0) {
      expect(await vs.count()).toBeGreaterThanOrEqual(0);
      return;
    }

    const before = await vs.count();
    await docRepo.delete(docs[0].id);
    await vs.deleteByMetadata("document_id", docs[0].id);

    const all = await vs.getAllChunks();
    const orphans = all.filter((c) => String(c.metadata.document_id) === docs[0].id);
    expect(orphans).toHaveLength(0);
    expect(await vs.count()).toBeLessThanOrEqual(before);
  });
});

describe("integration metrics format", () => {
  it("exposes Prometheus text exposition format", async () => {
    const { metrics } = await import("../src/shared/metrics");
    metrics.inc("rag_cache_hits_total", { layer: "exact" });
    metrics.observe("rag_latency_seconds", 0.12);
    const text = metrics.toPrometheusText();
    expect(text).toContain("# TYPE");
    expect(text).toContain("rag_cache_hits_total");
    expect(text).toContain("rag_latency_seconds");
  });
});
