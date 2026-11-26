import Link from "next/link";
import { Empty } from "antd";
import { ResponsiveTable } from "@/app/_components/responsive-table";
import type { TableProps } from "antd";
import { IconUser, IconUsers } from "@tabler/icons-react";

import { AssignStudentFormWrapper } from "./_components/assign-student-form.vm";
import { GroupCreateFormWrapper } from "./_components/group-create-form.vm";
import { TEST_IDS } from "@/constants/test-ids";
import type {
  GroupSummary,
  Page,
  StudentSummary,
} from "@/modules/advising/domain/models";

import type { ReactNode } from "react";

const columns: TableProps<StudentSummary>["columns"] = [
  { title: "نام", dataIndex: "fullName", key: "fullName" },
  { title: "نام کاربری", dataIndex: "username", key: "username" },
  { title: "پایه", dataIndex: "grade", key: "grade", render: (value) => value ?? "—" },
  {
    title: "گروه",
    dataIndex: "groupName",
    key: "groupName",
    render: (value) => value ?? "بدون گروه",
  },
  {
    title: "برنامه",
    key: "program",
    render: (_, record: StudentSummary) => (
      <Link href={`/counselor/students/${record.id}`} className="text-sm text-slate-600 hover:underline">
        مشاهده
      </Link>
    ),
  },
];

// Unowned students have no study-plan page yet, so no "مشاهده" link.
const unassignedColumns = columns.filter(
  (column) => column.key !== "program" && column.key !== "groupName",
);

export function CounselorRosterView({
  groups,
  myStudents,
  unassigned,
  assignable,
  onPageMy,
  onPageUnassigned,
  fieldOptions,
  gradeOptions,
}: {
  groups: GroupSummary[];
  myStudents: Page<StudentSummary>;
  unassigned: Page<StudentSummary>;
  assignable: StudentSummary[];
  onPageMy: (page: number) => void;
  onPageUnassigned: (page: number) => void;
  fieldOptions: string[];
  gradeOptions: string[];
}): ReactNode {
  const rosterPager = (
    current: number,
    total: number,
    onChange: (page: number) => void,
  ) => ({
    current,
    pageSize: 10,
    total,
    showSizeChanger: false,
    onChange,
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">پنل مشاور</h1>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <IconUsers size={20} stroke={1.8} />
            گروه‌های من
          </h2>
          <GroupCreateFormWrapper
            fieldOptions={fieldOptions}
            gradeOptions={gradeOptions}
          />
        </div>
        {groups.length === 0 ? (
          <Empty description="هنوز گروهی نساخته‌اید" />
        ) : (
          <ul className="flex flex-wrap gap-2" data-testid={TEST_IDS.ROSTER.GROUPS}>
            {groups.map((group) => (
              <li
                key={group.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm"
              >
                <span
                  aria-hidden
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                {group.name}
                <span className="text-xs text-slate-500">({group.studentCount} نفر)</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">دانش‌آموزان من</h2>
        <ResponsiveTable<StudentSummary>
          testId={TEST_IDS.ROSTER.TABLE}
          rowKey="id"
          size="small"
          columns={columns ?? []}
          dataSource={myStudents.items}
          emptyText="هنوز دانش‌آموزی ندارید"
          pagination={rosterPager(myStudents.page, myStudents.total, onPageMy)}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <IconUser size={20} stroke={1.8} />
          تخصیص دانش‌آموز به گروه
        </h2>
        {groups.length === 0 || assignable.length === 0 ? (
          <p className="text-sm text-slate-600">
            برای تخصیص، باید حداقل یک گروه و یک دانش‌آموز وجود داشته باشد.
          </p>
        ) : (
          <AssignStudentFormWrapper groups={groups} students={assignable} />
        )}
      </section>

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.ROSTER.UNASSIGNED_SECTION}
      >
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <IconUser size={20} stroke={1.8} />
          بدون گروه
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          دانش‌آموزانی که هنوز به شما تخصیص نیافته‌اند.
        </p>
        <ResponsiveTable<StudentSummary>
          rowKey="id"
          size="small"
          columns={unassignedColumns}
          dataSource={unassigned.items}
          emptyText="دانش‌آموز بدون گروهی وجود ندارد"
          pagination={rosterPager(unassigned.page, unassigned.total, onPageUnassigned)}
        />
      </section>
    </div>
  );
}
