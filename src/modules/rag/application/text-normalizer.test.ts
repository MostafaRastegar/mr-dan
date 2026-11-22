import { describe, expect, it } from "vitest";
import { normalizeText } from "./text-normalizer";

describe("normalizeText", () => {
  it("removes BOM everywhere", () => {
    expect(normalizeText("\uFEFFhello\uFEFFworld")).toBe("helloworld");
  });

  it("normalizes CRLF and CR to LF", () => {
    expect(normalizeText("a\r\nb\rc\n")).toBe("a\nb\nc");
  });

  it("converts vertical tab and form feed to newline", () => {
    expect(normalizeText("a\vb\fc")).toBe("a\nb\nc");
  });

  it("collapses runs of 2+ horizontal whitespace to one space", () => {
    expect(normalizeText("a    b\t   c")).toBe("a b c");
    // single spaces are preserved
    expect(normalizeText("a b c")).toBe("a b c");
  });

  it("collapses 3+ consecutive newlines into one blank line", () => {
    expect(normalizeText("a\n\n\n\nb")).toBe("a\n\nb");
  });

  it("trims leading/trailing whitespace", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(normalizeText("")).toBe("");
  });
});
