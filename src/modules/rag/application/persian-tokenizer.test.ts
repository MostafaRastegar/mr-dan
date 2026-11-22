import { describe, expect, it } from "vitest";
import { persianPreprocess } from "./persian-tokenizer";

describe("persianPreprocess", () => {
  it("splits on whitespace", () => {
    expect(persianPreprocess("سلام دنیا")).toEqual(["سلام", "دنیا"]);
  });

  it("treats ZWNJ as a separator", () => {
    expect(persianPreprocess("نیم‌فاصله")).toContain("نیم");
    expect(persianPreprocess("نیم‌فاصله")).toContain("فاصله");
  });

  it("unifies Arabic/Persian letter variants", () => {
    // ي (Arabic yeh) unifies with ی (Persian yeh)
    const a = persianPreprocess("يكي");
    const b = persianPreprocess("یکی");
    expect(a).toEqual(b);
  });

  it("drops tokens shorter than 2 chars", () => {
    expect(persianPreprocess("abc cd")).toEqual(["abc", "cd"]);
    // single Arabic/Persian letters are dropped even when attached to Latin:
    // "بabc" is one token (ب is inside Arabic block), len>1 so kept
    expect(persianPreprocess("بabc")).toEqual(["بabc"]);
  });

  it("lowercases", () => {
    expect(persianPreprocess("SALAM")).toEqual(["salam"]);
  });

  it("returns empty for empty input", () => {
    expect(persianPreprocess("")).toEqual([]);
    expect(persianPreprocess("   ")).toEqual([]);
  });

  it("keeps Persian punctuation attached (inside \\u0600-\\u06FF block)", () => {
    // Persian comma and question mark live in Arabic block, so they are not
    // separators; the tokens include them (same as oracle)
    expect(persianPreprocess("سلام، دنیا؟")).toEqual(["سلام،", "دنیا؟"]);
  });
});
