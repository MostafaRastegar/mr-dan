import type { ReactNode } from "react";
import { Button } from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import type { Chapter, StudyPlanEntry } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { formatDuration } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

function dayLabel(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find((d) => d.day === dayOfWeek);
  return day ? day.label : String(dayOfWeek);
}

function chapterList(chapterIds: string[], chapters: Chapter[]): string {
  if (chapterIds.length === 0) return "—";
  return chapterIds
    .map((id) => {
      const chapter = chapters.find((c) => c.id === id);
      return chapter ? `فصل ${persianDigits.format(chapter.number)}` : "فصل نامشخص";
    })
    .join("، ");
}

interface StudyPlanTableViewProps {
  entries: StudyPlanEntry[];
  chapters: Chapter[];
  pending: boolean;
  formError: string | null;
  onDelete: (entryId: string) => void;
}

export function StudyPlanTableView(props: StudyPlanTableViewProps): ReactNode {
  const { entries, chapters, pending, formError, onDelete } = props;

  const weeklyTotal = entries.reduce((sum, entry) => sum + entry.minutes, 0);
  const subjectTotals: Record<string, number> = {};
  for (const entry of entries) {
    subjectTotals[entry.subject] =
      (subjectTotals[entry.subject] ?? 0) + entry.minutes;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-slate-500">
        جمع هفتگی:{" "}
        <span
          className="text-lg font-bold dir-ltr"
          data-testid={TEST_IDS.COUNSELOR_PLAN.WEEKLY_TOTAL}
        >
          {formatDuration(weeklyTotal)}
        </span>
      </div>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table
          className="w-full text-sm border-collapse"
          data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_TABLE}
        >
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left p-2 border-b border-slate-200">روز</th>
              <th className="text-left p-2 border-b border-slate-200">درس</th>
              <th className="text-left p-2 border-b border-slate-200 dir-ltr">
                ساعت
              </th>
              <th
                className="text-left p-2 border-b border-slate-200"
                data-testid={TEST_IDS.COUNSELOR_PLAN.CHAPTER_COLUMN}
              >
                فصل‌ها
              </th>
              <th
                className="text-left p-2 border-b border-slate-200"
                data-testid={TEST_IDS.COUNSELOR_PLAN.NOTE_COLUMN}
              >
                یادداشت
              </th>
              <th className="text-right p-2 border-b border-slate-200">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100">
                <td className="p-2">{dayLabel(entry.dayOfWeek)}</td>
                <td className="p-2">{subjectLabel(entry.subject)}</td>
                <td className="p-2 dir-ltr">{formatDuration(entry.minutes)}</td>
                <td className="p-2 text-sm">
                  {chapterList(entry.chapterIds, chapters)}
                </td>
                <td className="p-2 text-sm">{entry.note ?? "—"}</td>
                <td className="p-2 text-right">
                  <Button
                    size="small"
                    danger
                    loading={pending}
                    onClick={() => onDelete(entry.id)}
                    data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_ROW_DELETE}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-2 text-center text-slate-400 text-sm"
                >
                  هنوز ردیفی ثبت نشده است
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {Object.entries(subjectTotals).map(([subject, totalMinutes]) => (
          <div key={subject} className="border border-slate-100 rounded p-2 text-sm">
            <span className="text-slate-500">{subjectLabel(subject)}</span>
            <span className="text-slate-900 dir-ltr float-left">
              {formatDuration(totalMinutes)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
