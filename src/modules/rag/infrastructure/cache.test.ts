import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryCache } from "./cache";
import type { Answer } from "@/modules/rag/domain/models";

const answer = (text: string): Answer => ({
  text,
  sources: [],
  cache: { layer: "none", hit: false },
});

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  it("exact hit returns stored answer", async () => {
    await cache.setExact("k", answer("a"), 3600);
    expect(await cache.getExact("k")).toEqual(answer("a"));
  });

  it("exact miss when key absent", async () => {
    expect(await cache.getExact("missing")).toBeNull();
  });

  it("exact entry expires after TTL", async () => {
    await cache.setExact("k", answer("a"), 1);
    vi.setSystemTime(Date.now() + 2000);
    expect(await cache.getExact("k")).toBeNull();
  });

  it("semantic hit when cosine is above threshold", async () => {
    const v = [1, 0, 0];
    await cache.setSemantic(v, answer("x"), 3600);
    expect(await cache.getSemantic([1, 0, 0])).toEqual(answer("x"));
  });

  it("semantic miss when below threshold", async () => {
    await cache.setSemantic([1, 0, 0], answer("x"), 3600);
    expect(await cache.getSemantic([0, 1, 0])).toBeNull();
  });

  it("clear empties both layers", async () => {
    await cache.setExact("k", answer("a"), 3600);
    await cache.setSemantic([1, 0, 0], answer("b"), 3600);
    await cache.clear();
    expect(await cache.getExact("k")).toBeNull();
    expect(await cache.getSemantic([1, 0, 0])).toBeNull();
  });

  it("evicts oldest entries when over max size", async () => {
    const oneHot = (i: number) =>
      Array.from({ length: 550 }, (_, j) => (j === i ? 1 : 0));

    // All one-hots are pairwise orthogonal (cosine 0 < 0.97), so they never
    // semantically match each other; eviction is purely by insertion order.
    for (let i = 0; i < 550; i += 1) {
      await cache.setSemantic(oneHot(i), answer(`v${i}`), 3600);
    }

    // First entry must have been evicted; last entry must still be present.
    expect(await cache.getSemantic(oneHot(0))).toBeNull();
    expect(await cache.getSemantic(oneHot(549))).toEqual(answer("v549"));
  });
});
