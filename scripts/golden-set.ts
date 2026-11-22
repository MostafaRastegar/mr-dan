/**
 * Golden set for RAG retrieval parity testing.
 *
 * Ported from mr-rag (oracle) scripts/eval_retrieval.py.
 * `expected_source` matches the `original_filename` chunk metadata.
 * `expected_keywords` are optional tokens that must appear in at least one
 * retrieved chunk's text.
 */

import type { SearchResult } from "@/modules/rag/domain/models";

export interface GoldenCase {
  question: string;
  expectedSource: string;
  expectedKeywords: string[];
}

export const GOLDEN_SET: GoldenCase[] = [
  // --- English documents (final report.txt) ---
  {
    question: "What is the Test Lamp methodology in SMPS diagnostics?",
    expectedSource: "final report.txt",
    expectedKeywords: ["lamp"],
  },
  {
    question: "What are the cold mode benchmarks for a bridge rectifier?",
    expectedSource: "final report.txt",
    expectedKeywords: ["bridge"],
  },
  {
    question: "What causes a clicking or slow-to-start power supply?",
    expectedSource: "final report.txt",
    expectedKeywords: ["vcc"],
  },
  {
    question: "How do I measure the switching frequency of an SMPS?",
    expectedSource: "final report.txt",
    expectedKeywords: ["frequenc"],
  },
  {
    question: "What does the half-voltage rule indicate?",
    expectedSource: "final report.txt",
    expectedKeywords: ["half"],
  },
  {
    question: "What is the role of the optocoupler and TL431 in the feedback loop?",
    expectedSource: "final report.txt",
    expectedKeywords: ["tl431"],
  },
  {
    question: "Why must the main filter capacitor be discharged before cold testing?",
    expectedSource: "final report.txt",
    expectedKeywords: ["capacitor"],
  },
  {
    question: "Component verification using multimeter diode mode",
    expectedSource: "final report.txt",
    expectedKeywords: ["diode"],
  },
  {
    question: "What does a sustained bright test lamp indicate?",
    expectedSource: "final report.txt",
    expectedKeywords: ["lamp"],
  },
  {
    question: "Symptom: dead power supply with no 300V rail",
    expectedSource: "final report.txt",
    expectedKeywords: ["300v"],
  },
  // --- Persian documents (p*.txt) ---
  {
    question: "روشن ماندن لامپ تست در منبع تغذیه سوئیچینگ نشانه چیست؟",
    expectedSource: "p9.txt",
    expectedKeywords: ["لامپ"],
  },
  {
    question: "استفاده از لامپ تست چه فایده‌ای دارد؟",
    expectedSource: "p1.txt",
    expectedKeywords: ["لامپ"],
  },
  {
    question: "چطور مقاومت استارت‌آپ را تست کنیم؟",
    expectedSource: "p10.txt",
    expectedKeywords: ["استارت"],
  },
];

/**
 * Return true when a search result is attributable to the expected source.
 * Mirrors oracle `_matches`.
 */
export function matches(result: SearchResult, case_: GoldenCase): boolean {
  const metadata = result.chunk.metadata ?? {};
  const source = String(
    metadata["original_filename"] ?? metadata["source"] ?? "",
  ).split("/")
    .pop()!;
  if (!source) return false;
  if (!source.toLowerCase().includes(case_.expectedSource.toLowerCase())) {
    return false;
  }
  if (case_.expectedKeywords.length === 0) return true;
  const text = (result.chunk.text ?? "").toLowerCase();
  return case_.expectedKeywords.every((k) => text.includes(k.toLowerCase()));
}
