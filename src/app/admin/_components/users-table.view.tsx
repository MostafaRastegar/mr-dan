import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { IconFilter } from "@tabler/icons-react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Tag,
  type FormInstance,
} from "antd";
import type { ColumnType } from "antd/es/table";

import { FormSheet } from "@/app/_components/form-sheet";
import { ResponsiveTable } from "@/app/_components/responsive-table";

import type {
  AdminCounselorOption,
  AdminUserRow,
  Role,
} from "@/modules/advising/domain/models";
import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";

const ROLE_LABELS: Record<Role, string> = {
  student: "دانش‌آموز",
  counselor: "مشاور",
  admin: "مدیر",
  operator: "اپراتور",
};

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const ROLE_FILTER_OPTIONS = [{ value: "", label: "همه" }, ...ROLE_OPTIONS];

function activeFilterCount(filters: UsersFilterValues): number {
  return [filters.role, filters.counselorId, filters.q.trim()].filter(
    Boolean,
  ).length;
}


export interface UsersFilterValues {
  role: string;
  counselorId: string;
  q: string;
}

type RoleTarget = { userId: string; username: string; role: Role };

interface UsersTableViewProps {
  rows: readonly AdminUserRow[];
  total: number;
  currentPage: number;
  pageSize: number;
  basePath: string;
  filters: UsersFilterValues;
  counselorOptions: readonly AdminCounselorOption[];
  counselorOptionsFailed: boolean;
  onFilterChange: (patch: Partial<UsersFilterValues>) => void;
  onApplyFilters: () => void;
  loading: boolean;
  onPageChange: (page: number) => void;
  readFailed: boolean;
  canManageRole: boolean;
  canSupport: boolean;
  canSupervise: boolean;
  roleTarget: RoleTarget | null;
  onOpenRole: (row: AdminUserRow, role: Role) => void;
  onConfirmRole: () => void;
  onCancelRole: () => void;
  rolePending: boolean;
  editTarget: AdminUserRow | null;
  form: FormInstance;
  supportError: string | null;
  supportPending: boolean;
  onSubmitEdit: (values: FormValues) => void;
  onOpenEdit: (row: AdminUserRow) => void;
  onCloseEdit: () => void;
  onReset: (userId: string) => void;
  resetPending: boolean;
  temporaryPassword: string | null;
  successMessage: string | null;
  errorMessage: string | null;
}

export function UsersTableView(props: UsersTableViewProps): ReactNode {
  const [filterOpen, setFilterOpen] = useState(false);
  const {
    rows,
    total,
    currentPage,
    pageSize,
    basePath,
    filters,
    counselorOptions,
    counselorOptionsFailed,
    onFilterChange,
    onApplyFilters,
    loading,
    onPageChange,
    readFailed,
    canManageRole,
    canSupport,
    canSupervise,
    roleTarget,
    onOpenRole,
    onConfirmRole,
    onCancelRole,
    rolePending,
    editTarget,
    form,
    supportError,
    supportPending,
    onSubmitEdit,
    onOpenEdit,
    onCloseEdit,
    onReset,
    resetPending,
    temporaryPassword,
    successMessage,
    errorMessage,
  } = props;

  const columns: ColumnType<AdminUserRow>[] = [
    {
      key: "username",
      title: "نام کاربری",
      render: (_: unknown, row) => (
        <span dir="ltr" className="whitespace-nowrap">
          {row.username}
        </span>
      ),
    },
    { key: "fullName", title: "نام کامل", render: (_: unknown, row) => row.fullName },
    {
      key: "email",
      title: "ایمیل",
      render: (_: unknown, row) => (
        <span dir="ltr" className="whitespace-nowrap">
          {row.email ?? "—"}
        </span>
      ),
    },
    {
      key: "role",
      title: "نقش",
      render: (_: unknown, row) =>
        canManageRole ? (
          <Select<Role>
            value={row.role}
            options={ROLE_OPTIONS}
            onChange={(role) => onOpenRole(row, role)}
            className="min-w-[8rem]"
            aria-label={`نقش ${row.username}`}
            data-testid={TEST_IDS.ADMIN.ROLE_SELECT}
          />
        ) : (
          <Tag>{ROLE_LABELS[row.role]}</Tag>
        ),
    },
    {
      key: "counselor",
      title: "مشاور",
      render: (_: unknown, row) =>
        row.counselorId && row.counselorUsername ? (
          <Link
            href={`${basePath}?counselor=${row.counselorId}&page=${currentPage}&pageSize=${pageSize}`}
            dir="ltr"
            className="whitespace-nowrap text-teal-700 underline"
            data-testid={TEST_IDS.ADMIN.COUNSELOR_FILTER(row.counselorId)}
          >
            {row.counselorUsername}
          </Link>
        ) : (
          "—"
        ),
    },
    ...(canSupervise
      ? [
          {
            key: "supervise",
            title: "پرونده",
            render: (_: unknown, row: AdminUserRow) =>
              row.role === "student" ? (
                <Link
                  href={`/counselor/students/${row.id}`}
                  className="whitespace-nowrap text-teal-700 underline"
                  data-testid={TEST_IDS.ADMIN.SUPERVISION_LINK(row.id)}
                >
                  مشاهده
                </Link>
              ) : (
                "—"
              ),
          },
        ]
      : []),
    {
      key: "createdAt",
      title: "تاریخ ایجاد",
      render: (_: unknown, row) => (
        <span className="whitespace-nowrap">
          {new Date(row.createdAt).toLocaleDateString("fa-IR")}
        </span>
      ),
    },
    {
      key: "actions",
      title: "عملیات",
      render: (_: unknown, row) =>
        canSupport ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="small"
              onClick={() => onOpenEdit(row)}
              data-testid={TEST_IDS.ADMIN.SUPPORT_EDIT(row.id)}
            >
              ویرایش
            </Button>
            <Popconfirm
              title="اعتبار این کاربر بازنشانی شود؟"
              okText="بله"
              cancelText="انصراف"
              okButtonProps={{ loading: resetPending }}
              onConfirm={() => onReset(row.id)}
            >
              <Button
                size="small"
                danger
                data-testid={TEST_IDS.ADMIN.RESET(row.id)}
              >
                بازنشانی اعتبار
              </Button>
            </Popconfirm>
          </div>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">کاربران</h1>
      </header>

      <div
        className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
        data-testid={TEST_IDS.ADMIN.FILTER_FORM}
      >
        <div className="flex items-center justify-between gap-2 md:hidden">
          <h2 className="text-lg font-semibold">کاربران</h2>
          <Button
            icon={<IconFilter size={16} stroke={2} aria-hidden="true" />}
            onClick={() => setFilterOpen(true)}
          >
            فیلتر
            {activeFilterCount(filters) ? ` (${activeFilterCount(filters)})` : ""}
          </Button>
        </div>
        <div className="hidden flex-col gap-3 md:flex md:flex-row md:flex-wrap md:items-end">
          <div className="space-y-1.5">
            <label htmlFor="admin-filter-role" className="text-sm">
              نقش
            </label>
            <Select<string>
              id="admin-filter-role"
              size="large"
              className="min-h-11 min-w-40"
              value={filters.role}
              options={ROLE_FILTER_OPTIONS}
              onChange={(role) => onFilterChange({ role })}
              data-testid={TEST_IDS.ADMIN.FILTER_ROLE}
            />
          </div>
          {counselorOptionsFailed ? (
            <p role="alert" className="self-end pb-2 text-sm text-red-600">
              فهرست مشاوران بارگذاری نشد.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="admin-filter-counselor" className="text-sm">
                مشاور
              </label>
              <Select<string>
                id="admin-filter-counselor"
                size="large"
                className="min-h-11 min-w-40"
                value={filters.counselorId}
                options={[
                  { value: "", label: "همه" },
                  ...counselorOptions.map((option) => ({
                    value: option.id,
                    label: option.username,
                  })),
                ]}
                onChange={(counselorId) => onFilterChange({ counselorId })}
                data-testid={TEST_IDS.ADMIN.FILTER_COUNSELOR}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="admin-filter-q" className="text-sm">
              جستجو
            </label>
            <Input
              id="admin-filter-q"
              size="large"
              className="min-h-11 min-w-56"
              placeholder="نام کاربری یا نام کامل"
              value={filters.q}
              onChange={(event) => onFilterChange({ q: event.target.value })}
              onPressEnter={onApplyFilters}
              data-testid={TEST_IDS.ADMIN.FILTER_QUERY}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="primary"
              size="large"
              className="min-h-11"
              onClick={onApplyFilters}
              data-testid={TEST_IDS.ADMIN.FILTER_APPLY}
            >
              اعمال
            </Button>
            <Button
              size="large"
              className="min-h-11"
              href={basePath}
              data-testid={TEST_IDS.ADMIN.FILTER_CLEAR}
            >
              پاک کردن
            </Button>
          </div>
        </div>

        <FormSheet
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          title="فیلتر کاربران"
        >
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <label htmlFor="admin-filter-role-m" className="text-sm">
                نقش
              </label>
              <Select<string>
                id="admin-filter-role-m"
                size="large"
                className="w-full"
                value={filters.role}
                options={ROLE_FILTER_OPTIONS}
                onChange={(role) => onFilterChange({ role })}
              />
            </div>
            {counselorOptionsFailed ? (
              <p role="alert" className="text-sm text-red-600">
                فهرست مشاوران بارگذاری نشد.
              </p>
            ) : (
              <div className="space-y-1.5">
                <label htmlFor="admin-filter-counselor-m" className="text-sm">
                  مشاور
                </label>
                <Select<string>
                  id="admin-filter-counselor-m"
                  size="large"
                  className="w-full"
                  value={filters.counselorId}
                  options={[
                    { value: "", label: "همه" },
                    ...counselorOptions.map((option) => ({
                      value: option.id,
                      label: option.username,
                    })),
                  ]}
                  onChange={(counselorId) => onFilterChange({ counselorId })}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="admin-filter-q-m" className="text-sm">
                جستجو
              </label>
              <Input
                id="admin-filter-q-m"
                size="large"
                placeholder="نام کاربری یا نام کامل"
                value={filters.q}
                onChange={(event) => onFilterChange({ q: event.target.value })}
                onPressEnter={onApplyFilters}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="primary"
              size="large"
              onClick={() => {
                onApplyFilters();
                setFilterOpen(false);
              }}
            >
              اعمال
            </Button>
            <Button size="large" href={basePath}>
              پاک کردن
            </Button>
          </div>
        </FormSheet>
      </div>

      {successMessage ? (
        <p role="status" className="text-sm text-teal-700">
          {successMessage}
        </p>
      ) : null}
      {temporaryPassword ? (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          گذرواژهٔ موقت (فقط همین یک بار نمایش داده می‌شود):{" "}
          <code dir="ltr" className="font-mono">
            {temporaryPassword}
          </code>
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      ) : null}

      {readFailed ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          خطا در دریافت فهرست کاربران. دوباره تلاش کنید.
        </p>
      ) : (
        <ResponsiveTable<AdminUserRow>
          testId={TEST_IDS.ADMIN.USERS_TABLE}
          rowKey="id"
          columns={columns}
          dataSource={rows as AdminUserRow[]}
          loading={loading}
          emptyText="کاربری یافت نشد"
          pagination={{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: false,
            onChange: onPageChange,
          }}
        />
      )}

      <Modal
        open={roleTarget !== null}
        title="تغییر نقش کاربر"
        okText="تأیید"
        cancelText="انصراف"
        confirmLoading={rolePending}
        onOk={onConfirmRole}
        onCancel={onCancelRole}
      >
        <p className="text-sm leading-7">
          نقش «{roleTarget?.username}» به «
          {roleTarget ? ROLE_LABELS[roleTarget.role] : ""}» تغییر کند؟
        </p>
      </Modal>

      <FormSheet
        open={editTarget !== null}
        onClose={onCloseEdit}
        title={`ویرایش ${editTarget?.username ?? ""}`}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={onSubmitEdit}
          className="space-y-4"
        >
          <Form.Item
            name="fullName"
            label="نام کامل"
            style={{ marginBottom: 0 }}
            rules={[{ required: true, message: "نام کامل را وارد کنید" }]}
          >
            <Input data-testid={TEST_IDS.FORM.INPUT("fullName")} />
          </Form.Item>
          <Form.Item
            name="email"
            label="ایمیل"
            style={{ marginBottom: 0 }}
          >
            <Input dir="ltr" data-testid={TEST_IDS.FORM.INPUT("email")} />
          </Form.Item>
          {supportError ? (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {supportError}
            </p>
          ) : null}
          <Button
            type="primary"
            htmlType="submit"
            loading={supportPending}
            block
          >
            ذخیره
          </Button>
        </Form>
      </FormSheet>
    </section>
  );
}
