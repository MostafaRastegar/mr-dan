import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Button, InputNumber } from "antd";
import { IconBook } from "@tabler/icons-react";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import { labelOf } from "@/modules/advising/domain/catalog";
import { formatDuration, formatNumber } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

interface StudyPlanViewProps {
  blocks: StudyBlock[];
  onSaveMinutes: (block: StudyBlock, minutes: number) => void;
  book: string | null;
  labels: Record<string, string>;
}

function PlanBlockRow({
  block,
  label,
  onSave,
}: {
  block: StudyBlock;
  label: string;
  onSave: (block: StudyBlock, minutes: number) => void;
}): ReactNode {
  const [minutes, setMinutes] = useState<number | null>(block.loggedMinutes ?? 0);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3">
      <span className="text-sm">
        {block.subject ? `${label} — ` : ""}
        {formatDuration(block.minutes)}
        {block.testsTarget ? (
          <span className="mr-1 text-xs text-slate-500">
            · هدف {formatNumber(block.testsTarget)} تست
          </span>
        ) : null}
      </span>
      <span className="flex items-center gap-1">
        <InputNumber
          size="small"
          min={0}
          max={1440}
          value={minutes}
          onChange={setMinutes}
          className="w-20"
          aria-label="دقیقهٔ مطالعهٔ امروز"
          data-testid={TEST_IDS.DASHBOARD.BLOCK_MINUTES(block.entryId ?? label)}
        />
        <Button
          size="small"
          onClick={() => onSave(block, minutes ?? 0)}
          data-testid={TEST_IDS.DASHBOARD.BLOCK_SAVE(block.entryId ?? label)}
        >
          ثبت
        </Button>
      </span>
    </li>
  );
}

export function StudyPlanView(props: StudyPlanViewProps): ReactNode {
  const { blocks, onSaveMinutes, book, labels } = props;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("plan")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700" aria-hidden="true">
          <IconBook size={18} stroke={1.8} />
        </span>
        <h2 className="text-lg font-semibold">برنامه امروز</h2>
      </div>
      {blocks.length === 0 ? (
        <p className="mb-4 text-sm text-slate-500">برای امروز ردیفی در برنامه نیست.</p>
      ) : (
        <ul className="flex flex-col gap-2 mb-4">
          {blocks.map((block) => (
            <PlanBlockRow
              key={`${block.entryId}-${block.loggedMinutes ?? 0}`}
              block={block}
              label={block.subject ? labelOf(labels, block.subject) : ""}
              onSave={onSaveMinutes}
            />
          ))}
        </ul>
      )}
      <Link
        href="/schedule"
        className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
      >
        مشاهده و اصلاح کل هفته
      </Link>
      <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
        <span className="text-slate-500">کتاب پیشنهادی:</span>{" "}
        <span className="font-medium">{book ?? "—"}</span>
      </div>
    </section>
  );
}
