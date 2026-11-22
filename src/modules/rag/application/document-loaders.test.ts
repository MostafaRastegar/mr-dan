import fs from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TextLoader } from "./document-loaders";
import { MarkdownLoader } from "./document-loaders";
import { JsonLoader } from "./document-loaders";

function writeTemp(content: string, suffix: string): string {
  const dir = fs.mkdtempSync(join(os.tmpdir(), "mr-dan-loader-"));
  const file = join(dir, `doc${suffix}`);
  fs.writeFileSync(file, content, "utf8");
  return file;
}

describe("TextLoader", () => {
  it("loads and normalizes a txt file", async () => {
    const file = writeTemp("  Hello\r\nWorld  \n\n\n", ".txt");
    const loader = new TextLoader();
    expect(loader.supports(file)).toBe(true);

    const doc = await loader.load(file);
    expect(doc.content).toBe("Hello\nWorld");
    expect(doc.metadata.file_type).toBe("txt");
  });

  it("rejects unsupported extension", () => {
    const loader = new TextLoader();
    expect(loader.supports("doc.pdf")).toBe(false);
  });
});

describe("MarkdownLoader", () => {
  it("extracts first heading as section", async () => {
    const file = writeTemp("# Introduction\n\nSome content here.", ".md");
    const loader = new MarkdownLoader();
    const doc = await loader.load(file);
    expect(doc.metadata.section).toBe("Introduction");
    expect(doc.content).toContain("Some content here");
  });
});

describe("JsonLoader", () => {
  it("detects content field", async () => {
    const file = writeTemp(
      JSON.stringify({ content: "The quick brown fox", title: "Demo" }),
      ".json",
    );
    const loader = new JsonLoader();
    const doc = await loader.load(file);
    expect(doc.content).toBe("The quick brown fox");
    expect(doc.metadata.content_field).toBe("content");
  });

  it("falls back to collecting all strings", async () => {
    const file = writeTemp(
      JSON.stringify({ items: [{ text: "one" }, { text: "two" }] }),
      ".json",
    );
    const loader = new JsonLoader();
    const doc = await loader.load(file);
    expect(doc.content).toContain("one");
    expect(doc.content).toContain("two");
    // no top-level content field → content_field is null
    expect(doc.metadata.content_field).toBeNull();
  });
});
