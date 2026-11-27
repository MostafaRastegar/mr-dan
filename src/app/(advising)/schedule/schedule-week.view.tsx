import { useState, type ReactNode } from "react";
import { Button, Empty, InputNumber } from "antd";
import { ResponsiveTable } from "@/app/_components/responsive-table";
import type { Chapter, SubjectRow } from "@/modules/advising/domain/models";
import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { labelOf } from "@/modules/advising/domain/catalog";
import { shiftDayKey } from "@/modules/advising/domain/day-key";
import {
  formatChapterList,
  formatDuration,
  formatNumber,
} from "@/modules/advising/presentation/planning-format";

import { SchoolProgramForm } from "./_components/school-program-form.vm";
import type { SchoolProgramEntry } from "./_components/school-program-form.view";
import { TEST_IDS } from "@/constants/test-ids";

export interface ScheduleRow {
  id: string;
  dayOfWeek: number;
  dayKey: string;
  subject: string;
  minutes: number;
  testsTarget: number;
  chapterIds: string[];
  note: string | null;
  loggedMinutes: number;
}

function dayLabel(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find((d) => d.day === dayOfWeek);
  return day ? day.label : String(dayOfWeek);
}

function dateLabel(dayKey: string): string {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "2-digit",
    month: "2-digit",
    calendar: "gregory",
  }).format(new Date(`${dayKey}T00:00:00Z`));
}

function MinutesCell({
  row,
  onSave,
}: {
  row: ScheduleRow;
  onSave: (row: ScheduleRow, minutes: number) => void;
}): ReactNode {
  const [minutes, setMinutes] = useState<number | null>(row.loggedMinutes);
  return (
    <div className="flex items-center gap-1">
      <InputNumber
        size="small"
        min={0}
        max={1440}
        value={minutes}
        onChange={setMinutes}
        className="w-20"
        aria-label="دقیقهٔ مطالعهٔ ثبت‌شده"
      />
      <Button
        size="small"
        onClick={() => onSave(row, minutes ?? 0)}
        data-testid={TEST_IDS.SCHEDULE.LOG_MINUTES_SAVE(row.id)}
      >
        ثبت
      </Button>
    </div>
  );
}

function TestsCell({
  subject,
  count,
  onSave,
}: {
  subject: string;
  count: number;
  onSave: (subject: string, count: number) => void;
}): ReactNode {
  const [value, setValue] = useState<number | null>(count);
  return (
    <div className="flex items-center gap-1">
      <InputNumber
        size="small"
        min={0}
        max={2000}
        value={value}
        onChange={setValue}
        className="w-20"
        aria-label={`تعداد تست ${subject}`}
      />
      <Button
        size="small"
        onClick={() => onSave(subject, value ?? 0)}
        data-testid={TEST_IDS.SCHEDULE.LOG_TESTS_SAVE(subject)}
      >
        ثبت
      </Button>
    </div>
  );
}

interface ScheduleWeekViewProps {
  rows: ScheduleRow[];
  chapters: Chapter[];
  labels: Record<string, string>;
  weekKey: string;
  currentWeekKey: string;
  plannedMinutes: number;
  testsTarget: number;
  studiedMinutes: number;
  testsDone: number;
  testsBySubject: Record<string, number>;
  schoolProgramEntries: SchoolProgramEntry[];
  canWriteProgram: boolean;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  error: string | null;
  onSaveMinutes: (row: ScheduleRow, minutes: number) => void;
  onSaveTests: (subject: string, count: number) => void;
  onGoToWeek: (weekKey: string) => void;
}

export function ScheduleWeekView(props: ScheduleWeekViewProps): ReactNode {
  const {
    rows,
    chapters,
    labels,
    weekKey,
    currentWeekKey,
    plannedMinutes,
    testsTarget,
    studiedMinutes,
    testsDone,
    testsBySubject,
    schoolProgramEntries,
    canWriteProgram,
    fieldOfStudy,
    subjects,
    error,
    onSaveMinutes,
    onSaveTests,
    onGoToWeek,
  } = props;

  const columns = [
    {
      title: "روز",
      key: "day",
      render: (record: ScheduleRow) => (
        <span className="whitespace-nowrap">
          {dayLabel(record.dayOfWeek)}{" "}
          <span className="text-xs text-slate-400">{dateLabel(record.dayKey)}</span>
        </span>
      ),
    },
    {
      title: "درس",
      key: "subject",
      render: (record: ScheduleRow) => labelOf(labels, record.subject),
    },
    {
      title: "برنامه",
      key: "minutes",
      render: (record: ScheduleRow) => formatDuration(record.minutes),
    },
    {
      title: "مطالعهٔ ثبت‌شده",
      key: "logged",
      render: (record: ScheduleRow) => (
        <MinutesCell key={`${record.id}-${record.loggedMinutes}`} row={record} onSave={onSaveMinutes} />
      ),
    },
    {
      title: "هدف تست",
      key: "testsTarget",
      render: (record: ScheduleRow) => formatNumber(record.testsTarget),
    },
    {
      title: "تست انجام‌شده (این درس)",
      key: "testsDone",
      render: (record: ScheduleRow) => {
        const count = testsBySubject[record.subject] ?? 0;
        return (
          <TestsCell
            key={`${record.subject}-${count}`}
            subject={record.subject}
            count={count}
            onSave={onSaveTests}
          />
        );
      },
    },
    {
      title: "فصل‌ها",
      key: "chapters",
      render: (record: ScheduleRow) => formatChapterList(record.chapterIds, chapters),
    },
    {
      title: "یادداشت",
      key: "note",
      render: (record: ScheduleRow) => record.note ?? "—",
    },
  ];

  const nextWeek = shiftDayKey(weekKey, 7);
  const endOfWeek = shiftDayKey(weekKey, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">برنامه هفتگی</h1>
          <div className="flex items-center gap-1">
            <Button size="small" onClick={() => onGoToWeek(shiftDayKey(weekKey, -7))} data-testid={TEST_IDS.SCHEDULE.WEEK_PREV}>
              هفتهٔ قبل
            </Button>
            <Button
              size="small"
              disabled={nextWeek > currentWeekKey}
              onClick={() => onGoToWeek(nextWeek)}
              data-testid={TEST_IDS.SCHEDULE.WEEK_NEXT}
            >
              هفتهٔ بعد
            </Button>
            {weekKey !== currentWeekKey ? (
              <Button size="small" type="link" onClick={() => onGoToWeek(currentWeekKey)} data-testid={TEST_IDS.SCHEDULE.WEEK_CURRENT}>
                هفتهٔ جاری
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {dateLabel(weekKey)} تا {dateLabel(endOfWeek)} · هدف تست هفته:{" "}
          {formatNumber(testsTarget)} · انجام‌شده: {formatNumber(testsDone)} تست و{" "}
          {formatDuration(studiedMinutes)} از {formatDuration(plannedMinutes)} مطالعه
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <div data-testid={TEST_IDS.SCHEDULE.EMPTY}>
          <Empty description="هنوز برنامه‌ای برای شما نوشته نشده است" />
        </div>
      ) : (
        <ResponsiveTable
          testId={TEST_IDS.SCHEDULE.TABLE}
          rowKey="id"
          dataSource={rows}
          columns={columns}
          emptyText="هنوز برنامه‌ای برای شما نوشته نشده است"
        />
      )}

      <SchoolProgramForm
        initialEntries={schoolProgramEntries}
        canWrite={canWriteProgram}
        fieldOfStudy={fieldOfStudy}
        subjects={subjects}
        labels={labels}
      />
    </div>
  );
}
