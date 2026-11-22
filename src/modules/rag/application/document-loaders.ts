/**
 * Document loaders for JSON / Markdown / Text / PDF.
 *
 * Each loader supports specific file extensions and returns a RawDocument
 * with normalized content and metadata.
 */

import fs from "node:fs";
import { normalizeText } from "@/modules/rag/application/text-normalizer";
import type { RawDocument } from "@/modules/rag/domain/models";
import type { DocumentLoaderPort } from "@/modules/rag/domain/ports";
import { DocumentLoadError, UnsupportedFileError } from "@/modules/rag/domain/errors";

function ext(filePath: string): ".json" | ".md" | ".markdown" | ".txt" | ".pdf" | "" {
  const m = filePath.toLowerCase().match(/\.([^.]+)$/);
  const e = m ? `.${m[1]}` : "";
  return e as ".json" | ".md" | ".markdown" | ".txt" | ".pdf" | "";
}

/** Detect the primary content field in a JSON document (top-level only). */
function detectContentField(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const field = detectContentField(item);
      if (field) return field;
    }
    return null;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of [
      "content",
      "text",
      "body",
      "description",
      "question",
      "answer",
      "title",
    ]) {
      if (typeof obj[key] === "string" && obj[key].trim().length > 0) {
        return key;
      }
    }
  }
  return null;
}

function collectStrings(value: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown) => {
    if (typeof v === "string") {
      out.push(v);
    } else if (Array.isArray(v)) {
      for (const item of v) walk(item);
    } else if (v && typeof v === "object") {
      for (const item of Object.values(v)) walk(item);
    }
  };
  walk(value);
  return out;
}

export class TextLoader {
  supports(filePath: string): boolean {
    return ext(filePath) === ".txt";
  }

  async load(filePath: string): Promise<RawDocument> {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      return {
        content: normalizeText(content),
        metadata: { file_type: "txt", source_path: filePath },
      };
    } catch (error) {
      throw new DocumentLoadError(`Failed to read ${filePath}`, error);
    }
  }
}

export class MarkdownLoader {
  supports(filePath: string): boolean {
    const e = ext(filePath);
    return e === ".md" || e === ".markdown";
  }

  async load(filePath: string): Promise<RawDocument> {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const normalized = normalizeText(raw);

      // Extract first heading as section metadata
      const headingMatch = raw.match(/^#{1,6}\s+(.+)$/m);
      const metadata: Record<string, unknown> = {
        file_type: "md",
        source_path: filePath,
      };
      if (headingMatch) {
        metadata.section = headingMatch[1].trim();
      }

      return { content: normalized, metadata };
    } catch (error) {
      throw new DocumentLoadError(`Failed to read ${filePath}`, error);
    }
  }
}

export class JsonLoader {
  supports(filePath: string): boolean {
    return ext(filePath) === ".json";
  }

  async load(filePath: string): Promise<RawDocument> {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);

      const field = detectContentField(parsed);
      let content = "";

      if (field && typeof (parsed as Record<string, unknown>)[field] === "string") {
        content = String((parsed as Record<string, unknown>)[field]);
      } else {
        content = collectStrings(parsed).join("\n");
      }

      return {
        content: normalizeText(content),
        metadata: { file_type: "json", source_path: filePath, content_field: field ?? null },
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new DocumentLoadError(`Invalid JSON in ${filePath}`, error);
      }
      throw new DocumentLoadError(`Failed to read ${filePath}`, error);
    }
  }
}

export class PdfLoader {
  supports(filePath: string): boolean {
    return ext(filePath) === ".pdf";
  }

  async load(filePath: string): Promise<RawDocument> {
    // Lazy import so unpdf is optional for non-PDF paths
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PDFDocument } = require("unpdf");

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const data = await PDFDocument.load(fileBuffer);

      const pages: string[] = [];
      for (let i = 0; i < data.numPages(); i += 1) {
        const page = data.getPage(i);
        const text = (await page.getTextContent()).items
          .map((item: unknown) => {
            const typed = item as { str?: string };
            return typed.str ?? "";
          })
          .join("");
        pages.push(text);
      }

      const content = normalizeText(pages.join("\n\n"));
      return {
        content,
        metadata: {
          file_type: "pdf",
          source_path: filePath,
          page_count: data.numPages(),
        },
      };
    } catch (error) {
      throw new DocumentLoadError(`Failed to parse PDF ${filePath}`, error);
    }
  }
}

/**
 * Registry of loaders. Returns the first loader whose `supports` matches.
 */
export class DocumentLoaderRegistry {
  private loaders: DocumentLoaderPort[] = [];

  register(loader: DocumentLoaderPort): void {
    this.loaders.push(loader);
  }

  resolve(filePath: string): DocumentLoaderPort {
    const loader = this.loaders.find((l) => l.supports(filePath));
    if (!loader) {
      const extension = ext(filePath);
      throw new UnsupportedFileError(extension || "unknown");
    }
    return loader;
  }
}

export const defaultRegistry = new DocumentLoaderRegistry();
defaultRegistry.register(new TextLoader());
defaultRegistry.register(new MarkdownLoader());
defaultRegistry.register(new JsonLoader());
defaultRegistry.register(new PdfLoader());
