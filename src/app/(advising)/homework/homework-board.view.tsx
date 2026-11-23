import type { ReactNode } from "react";
import Link from "next/link";
import { Table, Button, Empty } from "antd";
import type { HomeworkItem } from "@/modules/advising/domain/models";
import { subjectLabel } from "@/modules/advising/domain/subjects";
import { HOMEWORK_PRIORITY_LABEL } from "@/modules/advising/domain/models";
import { formatDeadline, homeworkStatus } from "@/modules/advising/presentation/planning-format";

import { HomeworkForm } from "./_components/homework-form.vm";
import { HomeworkControlsVM } from "./_components/homework-controls.vm";
import { TEST_IDS } from "@/constants/test-ids";

interface HomeworkBoardViewProps {
  items: HomeworkItem[];
  canWrite: boolean;
  todayKey: string;
  isFormOpen: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
}

const PRIORITY_LABEL: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
};

const STATUS_LABEL: Record<string, string> = {
  done: "انجام شده",
  overdue: "منقضی شده",
  today: "امروز",
  upcoming: "آینده",
};

export function HomeworkBoardView(props: HomeworkBoardViewProps): ReactNode {
  const {
    items,
    canWrite,
    todayKey,
    isFormOpen,
    onOpenForm,
    onCloseForm,
  } = props;

  const columns = [
    {
      title: "عنوان",
      key: "title",
      render: (record: HomeworkItem) => record.title,
    },
    {
      title: "درس",
      key: "subject",
      render: (record: HomeworkItem) =>
        record.subject ? subjectLabel(record.subject) : "—",
    },
    {
      title: "اولویت",
      key: "priority",
      render: (record: HomeworkItem) => {
        const rank = String(record.priority);
        const slug = HOMEWORK_PRIORITY_LABEL[Number(rank)];
        return PRIORITY_LABEL[slug ?? "low"] ?? "—";
      },
    },
    {
      title: "مهلت",
      key: "deadline",
      render: (record: HomeworkItem) => formatDeadline(record.deadline),
    },
    {
      title: "وضعیت",
      key: "status",
      render: (record: HomeworkItem) => {
        const status = homeworkStatus(record, todayKey);
        return STATUS_LABEL[status];
      },
    },
    ...(canWrite
      ? [
          {
            title: "عملیات",
            key: "actions",
            render: (record: HomeworkItem) => (
              <HomeworkControlsVM itemId={record.id} completed={record.completedAt !== null} />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">تکالیف</h1>
        <Link
          href={`/budget?date=${todayKey}`}
          className="text-sm text-teal-700"
        >
          برنامه‌ریزی وقت
        </Link>
      </div>

      {items.length === 0 ? (
        <div data-testid={TEST_IDS.HOMEWORK.EMPTY}>
          <Empty description="هیچ تکلیفی ثبت نشده است" />
        </div>
      ) : (
        <Table
          data-testid={TEST_IDS.HOMEWORK.TABLE}
          rowKey="id"
          scroll={{ x: "max-content" }}
          dataSource={items}
          columns={columns}
        />
      )}

      {canWrite && (
        <Button
          onClick={onOpenForm}
          data-testid={TEST_IDS.HOMEWORK.CREATE_FORM}
        >
          افزودن تکلیف
        </Button>
      )}

      {isFormOpen && canWrite && (
        <HomeworkForm onClose={onCloseForm} />
      )}
    </div>
  );
}
