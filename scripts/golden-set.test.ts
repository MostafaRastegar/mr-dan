import { describe, expect, it } from "vitest";
import { GOLDEN_SET, matches } from "../scripts/golden-set";

describe("golden set", () => {
  it("has 13 cases", () => {
    expect(GOLDEN_SET).toHaveLength(13);
  });

  it("every case has a question, source and keywords", () => {
    for (const caze of GOLDEN_SET) {
      expect(typeof caze.question).toBe("string");
      expect(caze.question.length).toBeGreaterThan(0);
      expect(typeof caze.expectedSource).toBe("string");
      expect(caze.expectedSource.length).toBeGreaterThan(0);
      expect(Array.isArray(caze.expectedKeywords)).toBe(true);
    }
  });

  it("matches a result whose original_filename contains expected source", () => {
    const caze = GOLDEN_SET[0]; // final report.txt, keyword "lamp"
    const result = {
      chunk: {
        id: "doc:abcd:0",
        text: "The Test Lamp methodology ...",
        metadata: { original_filename: "final report.txt", chunk_index: 0 },
      },
      score: 0.6,
    };
    expect(matches(result, caze)).toBe(true);
  });

  it("rejects wrong source", () => {
    const caze = GOLDEN_SET[0];
    const result = {
      chunk: {
        id: "doc:abcd:0",
        text: "lamp stuff",
        metadata: { original_filename: "p9.txt", chunk_index: 0 },
      },
      score: 0.9,
    };
    expect(matches(result, caze)).toBe(false);
  });

  it("requires expected keyword in text", () => {
    const caze = GOLDEN_SET[0];
    const result = {
      chunk: {
        id: "doc:abcd:0",
        text: "unrelated text without keyword",
        metadata: { original_filename: "final report.txt", chunk_index: 0 },
      },
      score: 0.9,
    };
    expect(matches(result, caze)).toBe(false);
  });

  it("matches with path prefix stripped from source", () => {
    const caze = GOLDEN_SET[10]; // p9.txt
    const result = {
      chunk: {
        id: "doc:abcd:0",
        text: "لامپ تست روشن است",
        metadata: { original_filename: "/tmp/p9.txt", chunk_index: 0 },
      },
      score: 0.7,
    };
    expect(matches(result, caze)).toBe(true);
  });

  it("case-insensitive source match", () => {
    const caze = GOLDEN_SET[0];
    const result = {
      chunk: {
        id: "doc:abcd:0",
        text: "lamp",
        metadata: { original_filename: "Final Report.TXT", chunk_index: 0 },
      },
      score: 0.5,
    };
    expect(matches(result, caze)).toBe(true);
  });
});
