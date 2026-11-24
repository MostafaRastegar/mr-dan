import type { ReactNode } from "react";
import { Collapse } from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { formatDuration } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";

interface SchoolProgramAccordionEntry {
  id: string;
  dayOfWeek: number;
  subjectLabel: string;
  minutes: number;
}

interface SchoolProgramAccordionViewProps {
  entries: SchoolProgramAccordionEntry[];
}

function groupByDay(entries: SchoolProgramAccordionEntry[]): Map<number, SchoolProgramAccordionEntry[]> {
  const map = new Map<number, SchoolProgramAccordionEntry[]>();
  for (const entry of entries) {
    const group = map.get(entry.dayOfWeek) ?? [];
    group.push(entry);
    map.set(entry.dayOfWeek, group);
  }
  return map;
}

export function SchoolProgramAccordionView(props: SchoolProgramAccordionViewProps): ReactNode {
  const { entries } = props;
  const { Panel: CollapsePanel } = Collapse;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">هیچ برنامه‌ای ثبت نشده است</p>
    );
  }

  const grouped = groupByDay(entries);

  return (
    <Collapse data-testid={TEST_IDS.SCHOOL_PROGRAM.TABLE}>
      {DAYS_OF_WEEK.map((d) => {
        const dayEntries = grouped.get(d.day) ?? [];
        const totalMinutes = dayEntries.reduce((sum: number, e: SchoolProgramAccordionEntry) => sum + e.minutes, 0);
        return (
          <CollapsePanel
            key={d.day}
            header={(
              <span className="flex justify-between gap-2">
                {d.label}
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
                </tr>
              </thead>
              <tbody>
                {dayEntries.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-2 text-center text-slate-400 text-sm">
                      برنامهای ثبت نشده
                    </td>
                  </tr>
                ) : (
                  dayEntries.map((entry: SchoolProgramAccordionEntry) => (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="p-2">{entry.subjectLabel}</td>
                      <td className="p-2 dir-ltr">{formatDuration(entry.minutes)}</td>
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
