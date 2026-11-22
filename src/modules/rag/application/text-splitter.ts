/**
 * Text splitter.
 *
 * Recursive character splitting with Persian-aware separators.
 * Defaults: chunkSize=800, chunkOverlap=120 (must match env).
 *
 * Separators are tried in order; the first separator that splits the text
 * into pieces smaller than chunkSize is used, then recursion continues on
 * pieces that are still too large.
 *
 * Chunk id is deterministic: `${documentId}:${chunkIndex}`.
 */

import type { Chunk, RawDocument } from "@/modules/rag/domain/models";

const DEFAULT_SEPARATORS = [
  "\n\n",
  "\n",
  "۔", // Arabic full stop
  ".",
  "؟", // Arabic question mark
  "?",
  "!",
  "؛", // Arabic semicolon
  ";",
  "،", // Arabic comma
  ",",
  " ",
  "",
];

interface SplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
}

export class TextSplitter {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;
  private readonly separators: string[];

  constructor(options: SplitOptions = {}) {
    this.chunkSize = options.chunkSize ?? 800;
    this.chunkOverlap = options.chunkOverlap ?? 120;
    this.separators = options.separators ?? DEFAULT_SEPARATORS;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error("chunkOverlap must be smaller than chunkSize");
    }
  }

  split(document: RawDocument): Chunk[] {
    const text = document.content;
    const documentId = this.documentId(document);

    const texts = this.splitText(text, this.separators);

    const chunks: Chunk[] = [];
    let index = 0;

    for (const piece of texts) {
      if (piece.length === 0) continue;
      chunks.push({
        id: `${documentId}:${index}`,
        text: piece,
        metadata: { ...document.metadata, chunk_index: index },
      });
      index += 1;
    }

    return chunks;
  }

  private documentId(document: RawDocument): string {
    const hash = document.metadata["contentHash"];
    return typeof hash === "string" ? hash : "unknown";
  }

  private splitText(text: string, separators: string[]): string[] {
    if (text.length <= this.chunkSize) {
      return [text];
    }

    const separator = separators[0];
    const remaining = separators.slice(1);

    const splits = separator === "" ? text.split("") : text.split(separator);

    const merged: string[] = [];
    let current = "";

    for (const split of splits) {
      const candidate = current ? current + separator + split : split;

      if (candidate.length > this.chunkSize) {
        if (current) {
          merged.push(current);
        }
        if (split.length > this.chunkSize) {
          // still too large: recurse with smaller separators
          if (remaining.length > 0) {
            merged.push(...this.splitText(split, remaining));
          } else {
            merged.push(split);
          }
          current = "";
        } else {
          current = split;
        }
      } else {
        current = candidate;
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  }
}

/**
 * Split a document into chunks with overlap applied between consecutive chunks.
 */
export function splitWithOverlap(
  document: RawDocument,
  splitter: TextSplitter,
): Chunk[] {
  const baseChunks = splitter.split(document);
  if (baseChunks.length <= 1) return baseChunks;

  const overlap = splitter["chunkOverlap"];

  const chunks: Chunk[] = [];
  for (let i = 0; i < baseChunks.length; i += 1) {
    const prev = baseChunks[i - 1];
    const next = baseChunks[i + 1];

    let text = baseChunks[i].text;

    // prepend tail of previous chunk
    if (prev && overlap > 0) {
      text = prev.text.slice(-overlap) + text;
    }

    // append head of next chunk
    if (next && overlap > 0) {
      text = text + next.text.slice(0, overlap);
    }

    chunks.push({
      id: `${baseChunks[i].id}`,
      text,
      metadata: { ...baseChunks[i].metadata, chunk_index: i },
    });
  }

  return chunks;
}
