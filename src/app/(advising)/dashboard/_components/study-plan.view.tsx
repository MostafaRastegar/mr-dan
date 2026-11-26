import type { ReactNode } from "react";
import { Button } from "antd";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import { studyBlockKey } from "@/modules/advising/domain/study-blocks";
import { labelOf } from "@/modules/advising/domain/catalog";
import { formatClock } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

interface StudyPlanViewProps {
  blocks: StudyBlock[];
  ticked: Set<string>;
  onToggle: (block: StudyBlock) => void;
  book: string | null;
  labels: Record<string, string>;
}

export function StudyPlanView(props: StudyPlanViewProps): ReactNode {
  const { blocks, ticked, onToggle, book, labels } = props;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("plan")}
    >
      <h2 className="mb-3 text-lg font-semibold">برنامه امروز</h2>
      <ul className="flex flex-col gap-2 mb-4">
        {blocks.map((block) => {
          const key = studyBlockKey(block);
          const done = ticked.has(key);
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-2 rounded border border-slate-200 p-3"
            >
              <span className="text-sm">
                {block.subject ? `${labelOf(labels, block.subject)} — ` : ""}
                {formatClock(block.startMinute)} — {formatClock(block.startMinute + block.minutes)}
                ({block.minutes}د)
              </span>
              {done ? (
                <span className="text-xs text-teal-700 font-medium">انجام شده</span>
              ) : (
                <Button
                  size="small"
                  onClick={() => onToggle(block)}
                  data-testid={TEST_IDS.DASHBOARD.BLOCK_TOGGLE(key)}
                >
                  تیک
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <span className="text-slate-500">کتاب پیشنهادی:</span>{" "}
        <span className="font-medium">{book ?? "—"}</span>
      </div>
    </section>
  );
}
