import { describe, expect, it } from "vitest";
import { normalizeText, stripZWNJ } from "./text-normalizer";

describe("normalizeText", () => {
  it("removes BOM", () => {
    expect(normalizeText("\uFEFFhello")).toBe("hello");
  });

  it("normalizes CRLF and CR to LF", () => {
    expect(normalizeText("a\r\nb\rc\n")).toBe("a\nb\nc");
  });

  it("removes vertical tab and form feed", () => {
    expect(normalizeText("a\vb\fc")).toBe("abc");
  });

  it("collapses horizontal whitespace runs", () => {
    expect(normalizeText("a    b\t   c")).toBe("a b c");
  });

  it("collapses 2+ blank lines into one", () => {
    expect(normalizeText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("stripZWNJ", () => {
  it("removes zero-width non-joiner", () => {
    expect(stripZWNJ("س\u200cمن")).toBe("سمن");
  });
});
