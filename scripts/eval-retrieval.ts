/**
 * Retrieval evaluation harness.
 *
 * Port of mr-rag/scripts/eval_retrieval.py. Runs the golden set against the
 * mr-dan retrieval pipeline and reports hit@5 / MRR, comparable to the oracle
 * baseline in docs/plan/parity.md.
 *
 * Usage:
 *   tsx scripts/eval-retrieval.ts --mode dense --top-k 5
 *   # optionally ingest a corpus directory first:
 *   tsx scripts/eval-retrieval.ts --ingest /path/to/corpus --mode dense
 *
 * Requires:
 *   - Chroma running (CHROMA_URL, default http://localhost:8001)
 *   - Documents already ingested into Chroma (see /api/ingest)
 *   - OPENROUTER_API_KEY set (for the embedding model)
 */

import { getContainer } from "@/server/container";
import { GOLDEN_SET, matches } from "./golden-set";

interface EvalReport {
  label: string;
  queries: number;
  hitAt5: number;
  mrr: number;
  scoreMin: number;
  scoreAvg: number;
  scoreMax: number;
  failures: Array<{ question: string; expectedSource: string }>;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function evaluate(
  label: string,
  questions: string[],
  topK: number,
): Promise<EvalReport> {
  const { searchKnowledge } = getContainer();
  const scores: number[] = [];
  const failures: EvalReport["failures"] = [];
  let hits = 0;
  const reciprocalRanks: number[] = [];

  for (const caze of GOLDEN_SET) {
    const question = caze.question;
    let results;
    try {
      const out = await searchKnowledge.execute({ question, topK });
      results = out.answer.sources;
    } catch (error) {
      console.error(`  ! retrieval error for "${question.slice(0, 40)}...":`);
      console.error(error);
      failures.push({ question, expectedSource: caze.expectedSource });
      scores.push(0);
      reciprocalRanks.push(0);
      continue;
    }

    let bestRank: number | null = null;
    let bestScore = 0;
    for (let i = 0; i < results.length; i += 1) {
      if (matches(results[i], caze)) {
        bestRank = i + 1; // 1-based
        bestScore = results[i].score;
        break;
      }
    }

    if (bestRank !== null && bestRank <= topK) {
      hits += 1;
      reciprocalRanks.push(1 / bestRank);
      scores.push(bestScore);
    } else {
      failures.push({ question, expectedSource: caze.expectedSource });
      scores.push(0);
      reciprocalRanks.push(0);
    }
  }

  return {
    label,
    queries: GOLDEN_SET.length,
    hitAt5: hits / GOLDEN_SET.length,
    mrr: mean(reciprocalRanks),
    scoreMin: Math.min(...scores),
    scoreAvg: mean(scores),
    scoreMax: Math.max(...scores),
    failures,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args.find((a) => a.startsWith("--mode="))?.split("=")[1] ?? "dense";
  const topKArg = args.find((a) => a.startsWith("--top-k="))?.split("=")[1];
  const topK = topKArg ? Number(topKArg) : 5;
  const ingestDir = args.find((a) => a.startsWith("--ingest="))?.split("=")[1];

  if (ingestDir) {
    // Ingest all files in a directory (top-level only).
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const entries = await fs.readdir(ingestDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const filePath = path.join(ingestDir, entry.name);
      const ext = entry.name.toLowerCase().replace(/.*\.(?=[^.]*$)/, "");
      if (!["json", "md", "txt", "pdf"].includes(ext)) continue;
      console.log(`ingesting ${filePath} ...`);
      try {
        const res = await fetch("http://localhost:3000/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath,
            originalFilename: entry.name,
            fileType: ext as any,
          }),
        });
        const json = await res.json();
        console.log("  ", json);
      } catch (error) {
        console.error("  failed to ingest", entry.name, error);
      }
    }
    console.log("ingestion complete\n");
  }

  console.log(`Running golden set (${GOLDEN_SET.length} queries), mode=${mode}, top_k=${topK}\n`);

  const report = await evaluate(mode.toUpperCase(), GOLDEN_SET.map((c) => c.question), topK);

  console.log(`label:       ${report.label}`);
  console.log(`queries:     ${report.queries}`);
  console.log(`hit@${topK}:    ${report.hitAt5.toFixed(4)}`);
  console.log(`mrr:         ${report.mrr.toFixed(4)}`);
  console.log(`score min:   ${report.scoreMin.toFixed(4)}`);
  console.log(`score avg:   ${report.scoreAvg.toFixed(4)}`);
  console.log(`score max:   ${report.scoreMax.toFixed(4)}`);
  console.log(`failures:    ${report.failures.length}`);
  for (const f of report.failures) {
    console.log(`  - "${f.question.slice(0, 60)}..." expected ${f.expectedSource}`);
  }

  // Phase 1 gate (dense only):
  //   hit@5 = 1.0, MRR >= 0.78
  if (mode === "dense") {
    const hitOk = report.hitAt5 === 1;
    const mrrOk = report.mrr >= 0.78;
    console.log(`\nPhase 1 gate: hit@5=${report.hitAt5.toFixed(4)} (expect 1.0) ${hitOk ? "PASS" : "FAIL"}`);
    console.log(`Phase 1 gate: MRR=${report.mrr.toFixed(4)} (expect >=0.78) ${mrrOk ? "PASS" : "FAIL"}`);
    if (!hitOk || !mrrOk) process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
