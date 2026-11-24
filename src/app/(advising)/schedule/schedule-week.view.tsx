import type { ReactNode } from "react";
import { Table, Button, Empty } from "antd";
import type { WeeklyScheduleEntry } from "@/modules/advising/domain/models";
import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { buildStudyBlocks } from "@/modules/advising/domain/study-blocks";
import { iranDayKey } from "@/modules/advising/domain/day-key";

import { ScheduleEntryForm } from "./_components/schedule-entry-form.vm";
import { ScheduleControlsVM } from "./_components/schedule-controls.vm";
import { SchoolProgramForm } from "./_components/school-program-form.vm";
import type { SchoolProgramEntry } from "./_components/school-program-form.view";
import { TEST_IDS } from "@/constants/test-ids";

interface ScheduleWeekViewProps {
  entries: WeeklyScheduleEntry[];
  schoolProgramEntries: SchoolProgramEntry[];
  canWrite: boolean;
  fieldOfStudy: string | null;
  isFormOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
}

export function ScheduleWeekView(props: ScheduleWeekViewProps): ReactNode {
  const {
    entries,
    schoolProgramEntries,
    canWrite,
    fieldOfStudy,
    isFormOpen,
    onOpenForm,
    onCloseForm,
  } = props;

  const todayKey = iranDayKey(new Date());

  const columns = [
    {
      title: "روز",
      key: "day",
      render: (record: WeeklyScheduleEntry) => {
        const day = DAYS_OF_WEEK.find((d) => d.day === record.dayOfWeek);
        return day ? day.label : String(record.dayOfWeek);
      },
    },
    {
      title: "زمان",
      key: "time",
      render: (record: WeeklyScheduleEntry) =>
        `${formatClock(record.startMinute)} — ${formatClock(record.endMinute)}`,
    },
    {
      title: "درس",
      key: "subject",
      render: (record: WeeklyScheduleEntry) => subjectLabel(record.subject),
    },
    {
      title: "معلم",
      key: "teacher",
      render: (record: WeeklyScheduleEntry) => record.teacher ?? "—",
    },
    {
      title: "اتاق",
      key: "room",
      render: (record: WeeklyScheduleEntry) => record.room ?? "—",
    },
    {
      title: "بلوک مطالعه",
      key: "blocks",
      render: (record: WeeklyScheduleEntry) => {
        const blocks = buildStudyBlocks({
          dayKey: todayKey,
          startMinute: record.startMinute,
          endMinute: record.endMinute,
          subject: record.subject,
        });
        if (blocks.length === 0) return "—";
        return (
          <div className="flex flex-col gap-1">
            {blocks.map((block) => (
              <span
                key={block.startMinute}
                className="text-xs text-slate-600 dir-ltr"
              >
                {formatClock(block.startMinute)} — {formatClock(block.startMinute + block.minutes)}
                ({block.minutes}د)
              </span>
            ))}
          </div>
        );
      },
    },
    ...(canWrite
      ? [
          {
            title: "عملیات",
            key: "actions",
            render: (record: WeeklyScheduleEntry) => (
              <ScheduleControlsVM entryId={record.id} />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">برنامه هفتگی</h1>
      </div>

      {entries.length === 0 ? (
        <div data-testid={TEST_IDS.SCHEDULE.EMPTY}>
          <Empty description="هیچ برنامه‌ای ثبت نشده است" />
        </div>
      ) : (
        <Table
          data-testid={TEST_IDS.SCHEDULE.TABLE}
          rowKey="id"
          scroll={{ x: "max-content" }}
          dataSource={entries}
          columns={columns}
        />
      )}

      {canWrite && (
        <Button
          onClick={onOpenForm}
          data-testid={TEST_IDS.SCHEDULE.CREATE_FORM}
        >
          افزودن درس
        </Button>
      )}

      {isFormOpen && canWrite && (
        <ScheduleEntryForm
          fieldOfStudy={fieldOfStudy}
          onClose={onCloseForm}
        />
      )}

      <SchoolProgramForm initialEntries={schoolProgramEntries} />
    </div>
  );
}
