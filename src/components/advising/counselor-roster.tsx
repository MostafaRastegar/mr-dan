"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Empty, Input, Table } from "antd";
import type { TableProps } from "antd";
import { IconPlus, IconUser, IconUsers } from "@tabler/icons-react";

import {
  FIELDS,
  GRADES,
  type GroupSummary,
  type StudentSummary,
} from "@/modules/advising/domain/models";
import {
  assignStudentAction,
  createGroupAction,
} from "@/server/advising-actions";

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none";

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
];

export default function CounselorRoster({
  groups,
  students,
}: {
  groups: GroupSummary[];
  students: StudentSummary[];
}) {
  const router = useRouter();
  const [createState, createAction, creating] = useActionState(
    createGroupAction,
    null,
  );
  const [assignState, assignAction, assigning] = useActionState(
    assignStudentAction,
    null,
  );

  useEffect(() => {
    if (createState?.ok || assignState?.ok) router.refresh();
  }, [createState, assignState, router]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <IconPlus size={20} stroke={1.8} />
          ساخت گروه
        </h2>
        <form action={createAction} className="grid gap-3 sm:grid-cols-2" noValidate>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm text-slate-700">نام گروه</span>
            <Input
              name="name"
              status={createState && !createState.ok && createState.error.fieldErrors?.name ? "error" : undefined}
            />
            {createState && !createState.ok && createState.error.fieldErrors?.name ? (
              <span className="text-xs text-red-600" role="alert">
                {createState.error.fieldErrors.name}
              </span>
            ) : null}
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-sm text-slate-700">توضیحات (اختیاری)</span>
            <Input name="description" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">پایهٔ هدف (اختیاری)</span>
            <select name="targetGrade" className={selectClass} defaultValue="">
              <option value="">انتخاب نشده</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">رشتهٔ هدف (اختیاری)</span>
            <select name="targetField" className={selectClass} defaultValue="">
              <option value="">انتخاب نشده</option>
              {FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <Button type="primary" htmlType="submit" loading={creating} icon={<IconPlus size={16} />}>
              ساخت گروه
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <IconUsers size={20} stroke={1.8} />
          گروه‌های من
        </h2>
        {groups.length === 0 ? (
          <Empty description="هنوز گروهی نساخته‌اید" />
        ) : (
          <ul className="flex flex-wrap gap-2">
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
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <IconUser size={20} stroke={1.8} />
          تخصیص دانش‌آموز به گروه
        </h2>
        {groups.length === 0 || students.length === 0 ? (
          <p className="text-sm text-slate-600">
            برای تخصیص، باید حداقل یک گروه و یک دانش‌آموز وجود داشته باشد.
          </p>
        ) : (
          <form action={assignAction} className="grid gap-3 sm:grid-cols-3" noValidate>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-700">دانش‌آموز</span>
              <select name="studentId" className={selectClass} defaultValue="">
                <option value="">انتخاب کنید</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.username})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-slate-700">گروه</span>
              <select name="groupId" className={selectClass} defaultValue="">
                <option value="">بدون گروه</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="primary" htmlType="submit" loading={assigning}>
                تخصیص
              </Button>
            </div>
          </form>
        )}
        {assignState && !assignState.ok ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {assignState.error.message}
          </p>
        ) : null}
        {assignState?.ok ? (
          <p className="mt-3 text-sm text-teal-700" role="status">
            تخصیص انجام شد.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">دانش‌آموزان</h2>
        <Table<StudentSummary>
          rowKey="id"
          size="small"
          pagination={false}
          columns={columns}
          dataSource={students}
          locale={{ emptyText: <Empty description="هنوز دانش‌آموزی ندارید" /> }}
        />
      </section>
    </div>
  );
}
