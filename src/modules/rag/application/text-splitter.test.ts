import { describe, expect, it } from "vitest";
import { TextSplitter } from "./text-splitter";

describe("TextSplitter", () => {
  const splitter = new TextSplitter({ chunkSize: 20, chunkOverlap: 4 });

  it("returns single chunk for short text", () => {
    const doc = { content: "short", metadata: {} };
    const chunks = splitter.split(doc);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe("short");
  });

  it("splits on newlines first", () => {
    const doc = { content: "line one\n\nline two\n\nline three", metadata: {} };
    const chunks = splitter.split(doc);
    expect(chunks.length).toBeGreaterThan(1);
    // splitter merges pieces up to chunkSize, so first chunk may contain multiple lines
    expect(chunks[0].text).toContain("line one");
  });

  it("deterministic ids", () => {
    // enough text to produce multiple chunks
    const content = Array(30).fill("word").join(" ");
    const doc = { content, metadata: { contentHash: "doc-123" } };
    const chunks = splitter.split(doc);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].id).toBe("doc-123:0");
    expect(chunks[1].id).toBe("doc-123:1");
  });

  it("empty pieces are dropped", () => {
    const doc = { content: "", metadata: {} };
    const chunks = splitter.split(doc);
    expect(chunks).toHaveLength(0);
  });
});
