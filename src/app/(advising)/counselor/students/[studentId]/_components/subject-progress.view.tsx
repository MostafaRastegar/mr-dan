import type { ReactNode } from "react";
import { Progress } from "antd";

import { formatDuration } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

interface SubjectProgressRow {
  subject: string;
  subjectLabel: string;
  plannedMinutes: number;
  studiedMinutes: number;
  testsDone: number;
  testsTarget: number;
}

interface SubjectProgressViewProps {
  entries: SubjectProgressRow[];
  testsTarget: number;
  testsDone?: number;
}

function shortfallLabel(studiedMinutes: number, plannedMinutes: number): string {
  const diff = studiedMinutes - plannedMinutes;
  const hours = persianDigits.format(Math.round(Math.abs(diff) / 60));
  if (diff > 0) return `${hours} ساعت جلوتر`;
  if (diff < 0) return `${hours} ساعت عقب`;
  return "طبق برنامه";
}

function sortRows(entries: SubjectProgressRow[]): SubjectProgressRow[] {
  return [...entries].sort((a, b) => {
    if (a.plannedMinutes === 0 && b.plannedMinutes === 0) return 0;
    if (a.plannedMinutes === 0) return 1;
    if (b.plannedMinutes === 0) return -1;
    return (b.plannedMinutes - b.studiedMinutes) - (a.plannedMinutes - a.studiedMinutes);
  });
}

export function SubjectProgressView(props: SubjectProgressViewProps): ReactNode {
  const { entries, testsTarget, testsDone } = props;
  const sorted = sortRows(entries);

  const totalPlannedMinutes = entries.reduce((sum, e) => sum + e.plannedMinutes, 0);
  const totalStudiedMinutes = entries.reduce((sum, e) => sum + e.studiedMinutes, 0);
  const totalTestsDone = testsDone ?? entries.reduce((sum, e) => sum + e.testsDone, 0);

  if (entries.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.SUBJECT_PROGRESS}>
        <h2 className="mb-3 text-lg font-semibold">پیشرفت دانش‌آموز به تفکیک درس</h2>
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-slate-500">برنامهٔ مطالعه ثبت نشده است</p>
          <div className="flex gap-4">
            <span className="dir-ltr font-mono">۰</span>
            <span className="text-slate-400">دقیقه مطالعه</span>
          </div>
          <div className="flex gap-4">
            <span className="dir-ltr font-mono">۰</span>
            <span className="text-slate-400">آزمون انجام شده</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.SUBJECT_PROGRESS}>
      <h2 className="mb-3 text-lg font-semibold">پیشرفت دانش‌آموز به تفکیک درس</h2>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 text-sm">
        <div className="border border-slate-100 rounded p-3">
          <span className="text-slate-500 block">دقائق مطالعه شده</span>
          <div className="flex gap-2">
            <span className="dir-ltr font-bold">{persianDigits.format(totalStudiedMinutes)}</span>
            <span className="text-slate-400">از {persianDigits.format(totalPlannedMinutes)}</span>
          </div>
        </div>
        <div className="border border-slate-100 rounded p-3">
          <span className="text-slate-500 block">آزمون انجام شده</span>
          <div className="flex gap-2">
            <span className="dir-ltr font-bold">{persianDigits.format(totalTestsDone)}</span>
            <span className="text-slate-400">از {persianDigits.format(testsTarget)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.map((entry) => {
          const percent =
            entry.plannedMinutes === 0
              ? 0
              : Math.min(100, Math.round((entry.studiedMinutes / entry.plannedMinutes) * 100));
          return (
            <div
              key={entry.subject}
              className="border border-slate-100 rounded p-3"
              data-testid={TEST_IDS.COUNSELOR_VIEW.SUBJECT_PROGRESS_ROW(entry.subject)}
            >
              <div className="flex justify-between mb-1 text-sm">
                <span className="font-medium">{entry.subjectLabel}</span>
                <span className="text-slate-500 dir-ltr">{shortfallLabel(entry.studiedMinutes, entry.plannedMinutes)}</span>
              </div>
              <Progress
                percent={percent}
                strokeColor={entry.studiedMinutes >= entry.plannedMinutes ? "#52c41a" : "primary"}
              />
              <div className="mt-2 flex justify-between gap-3 text-sm">
                <span>
                  برنامه‌ریزی شده: <span className="dir-ltr font-medium">{formatDuration(entry.plannedMinutes)}</span>
                </span>
                <span>
                  مطالعه شده: <span className="dir-ltr font-medium">{formatDuration(entry.studiedMinutes)}</span>
                </span>
                <span>
                  آزمون: <span className="dir-ltr font-medium">{persianDigits.format(entry.testsDone)}</span>
                  {entry.testsTarget > 0 ? (
                    <span className="text-slate-400"> / {persianDigits.format(entry.testsTarget)}</span>
                  ) : null}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
