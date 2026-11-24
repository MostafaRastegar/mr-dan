import type { ReactNode } from "react";
import { Collapse, Empty } from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";

import { TEST_IDS } from "@/constants/test-ids";
import type { SchoolProgramEntry } from "./school-program-form.view";

function groupByDay(entries: SchoolProgramEntry[]): Map<number, SchoolProgramEntry[]> {
  const map = new Map<number, SchoolProgramEntry[]>();
  for (const entry of entries) {
    const group = map.get(entry.dayOfWeek) ?? [];
    group.push(entry);
    map.set(entry.dayOfWeek, group);
  }
  return map;
}

interface SchoolProgramTableViewProps {
  entries: SchoolProgramEntry[];
  onDelete: (id: string) => void;
  formatDuration: (minutes: number) => string;
  dayLabel: (dayOfWeek: number) => string;
  subjectLabel: (slug: string) => string;
}

export function SchoolProgramTableView(props: SchoolProgramTableViewProps): ReactNode {
  const { entries, onDelete, formatDuration, dayLabel, subjectLabel } = props;
  const { Panel: CollapsePanel } = Collapse;

  if (entries.length === 0) {
    return (
      <div data-testid={TEST_IDS.SCHEDULE.EMPTY}>
        <Empty description="هیچ برنامه‌ای ثبت نشده است" />
      </div>
    );
  }

  const grouped = groupByDay(entries);

  return (
    <Collapse data-testid={TEST_IDS.SCHOOL_PROGRAM.TABLE}>
      {DAYS_OF_WEEK.map((d) => {
        const dayEntries = grouped.get(d.day) ?? [];
        const totalMinutes = dayEntries.reduce((sum: number, e: SchoolProgramEntry) => sum + e.hours * 60, 0);
        return (
          <CollapsePanel
            key={d.day}
            header={(
              <span className="flex justify-between gap-2">
                {dayLabel(d.day)}
                <span className="text-slate-500 dir-ltr" data-testid={TEST_IDS.SCHOOL_PROGRAM.DAY_TOTAL}>
                  {formatDuration(totalMinutes)}
                </span>
              </span>
            )}
            data-testid={TEST_IDS.SCHOOL_PROGRAM.DAY_PANEL(d.day)}
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-2 border-b border-slate-200 font-medium">درس</th>
                  <th className="text-left p-2 border-b border-slate-200 font-medium dir-ltr">ساعت</th>
                  <th className="text-right p-2 border-b border-slate-200 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {dayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-2 text-center text-slate-400 text-sm">
                      برنامهای ثبت نشده
                    </td>
                  </tr>
                ) : (
                  dayEntries.map((entry: SchoolProgramEntry) => (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="p-2">{subjectLabel(entry.subject)}</td>
                      <td className="p-2 dir-ltr">{formatDuration(entry.hours * 60)}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => onDelete(entry.id)}
                          className="text-xs text-red-600 hover:underline"
                          aria-label="حذف"
                          data-testid={TEST_IDS.SCHOOL_PROGRAM.DELETE_ROW}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CollapsePanel>
        );
      })}
    </Collapse>
  );
}
