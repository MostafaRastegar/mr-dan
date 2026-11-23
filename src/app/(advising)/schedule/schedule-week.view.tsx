import type { ReactNode } from "react";
import { Table, Button, Empty } from "antd";
import type { WeeklyScheduleEntry } from "@/modules/advising/domain/models";
import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { formatClock } from "@/modules/advising/presentation/planning-format";

import { ScheduleEntryForm } from "./_components/schedule-entry-form.vm";
import { ScheduleControlsVM } from "./_components/schedule-controls.vm";
import { TEST_IDS } from "@/constants/test-ids";

interface ScheduleWeekViewProps {
  entries: WeeklyScheduleEntry[];
  canWrite: boolean;
  fieldOfStudy: string | null;
  isFormOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
}

export function ScheduleWeekView(props: ScheduleWeekViewProps): ReactNode {
  const {
    entries,
    canWrite,
    fieldOfStudy,
    isFormOpen,
    onOpenForm,
    onCloseForm,
  } = props;

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
    </div>
  );
}
