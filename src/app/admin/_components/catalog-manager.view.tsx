import type { ReactNode } from "react";
import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Table,
  Tag,
  type FormInstance,
} from "antd";
import type { ColumnType } from "antd/es/table";

import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";

import type {
  CatalogConfig,
  CatalogFieldSpec,
  CatalogRow,
} from "./catalog-types";

interface CatalogManagerViewProps<T extends CatalogRow> {
  form: FormInstance;
  config: CatalogConfig;
  rows: readonly T[];
  total: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  readFailed: boolean;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  editingId: string | null;
  onEdit: (row: T) => void;
  onCancelEdit: () => void;
  onRetire: (row: T) => void;
  retirePending: boolean;
  saved: boolean;
  mutationError: string | null;
}

export function CatalogManagerView<T extends CatalogRow>(
  props: CatalogManagerViewProps<T>,
): ReactNode {
  const {
    form,
    config,
    rows,
    total,
    currentPage,
    pageSize,
    loading,
    onPageChange,
    readFailed,
    submit,
    pending,
    formError,
    editingId,
    onEdit,
    onCancelEdit,
    onRetire,
    retirePending,
    saved,
    mutationError,
  } = props;

  const columns: ColumnType<T>[] = [
    ...config.columns.map((column) => ({
      key: column.key,
      title: column.label,
      render: (_: unknown, row: T) => renderCell(readCell(row, column.key)),
    })),
    {
      key: "active",
      title: "وضعیت",
      render: (_: unknown, row: T) =>
        row.active ? <Tag color="green">فعال</Tag> : <Tag>غیرفعال</Tag>,
    },
    {
      key: "actions",
      title: "عملیات",
      render: (_: unknown, row: T) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            onClick={() => onEdit(row)}
            data-testid={TEST_IDS.ADMIN.CATALOG_EDIT(row.id)}
          >
            ویرایش
          </Button>
          {row.active ? (
            <Popconfirm
              title="این مورد بازنشسته شود؟"
              okText="بله"
              cancelText="انصراف"
              okButtonProps={{ loading: retirePending }}
              onConfirm={() => onRetire(row)}
            >
              <Button
                size="small"
                danger
                data-testid={TEST_IDS.ADMIN.CATALOG_RETIRE(row.id)}
              >
                بازنشسته
              </Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              onClick={() => onRetire(row)}
              data-testid={TEST_IDS.ADMIN.CATALOG_RETIRE(row.id)}
            >
              فعال‌سازی
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{config.title}</h1>
      </header>

      {readFailed ? (
        <p
          role="alert"
          className="rounded border border-red-300 bg-red-50 p-4 text-red-700"
        >
          خطا در دریافت داده‌ها. دوباره تلاش کنید.
        </p>
      ) : (
        <>
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
            onFinish={submit}
            data-testid={config.createTestId}
            className="rounded-lg border border-slate-200 bg-white p-4 md:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  style={{ marginBottom: 0 }}
                  rules={
                    field.required
                      ? [
                          {
                            required: true,
                            message: `${field.label} را وارد کنید`,
                          },
                        ]
                      : undefined
                  }
                >
                  {renderField(field)}
                </Form.Item>
              ))}
            </div>

            {formError ? (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {formError}
              </p>
            ) : null}
            {saved ? (
              <p role="status" className="mt-4 text-sm text-teal-700">
                ذخیره شد.
              </p>
            ) : null}
            {mutationError ? (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {mutationError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="primary" htmlType="submit" loading={pending}>
                {editingId ? "ذخیرهٔ ویرایش" : "افزودن"}
              </Button>
              {editingId ? (
                <Button onClick={onCancelEdit}>انصراف</Button>
              ) : null}
            </div>
          </Form>

          <div data-testid={config.tableTestId}>
            <Table<T>
              rowKey="id"
              columns={columns}
              dataSource={rows as T[]}
              loading={loading}
              scroll={{ x: 720 }}
              pagination={{
                current: currentPage,
                pageSize,
                total,
                showSizeChanger: false,
                onChange: onPageChange,
              }}
              locale={{
                emptyText: <Empty description="موردی ثبت نشده است" />,
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

function renderField(field: CatalogFieldSpec): ReactNode {
  switch (field.kind) {
    case "select":
      return (
        <Select
          allowClear
          options={field.options}
          data-testid={TEST_IDS.FORM.SELECT(field.name)}
        />
      );
    case "multiselect":
      return (
        <Select
          mode="multiple"
          allowClear
          options={field.options}
          data-testid={TEST_IDS.FORM.SELECT(field.name)}
        />
      );
    case "number":
      return (
        <InputNumber
          className="w-full"
          data-testid={TEST_IDS.FORM.INPUT(field.name)}
        />
      );
    default:
      return <Input data-testid={TEST_IDS.FORM.INPUT(field.name)} />;
  }
}

function readCell(row: CatalogRow, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key];
}

function renderCell(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join("، ") : "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  return <span className="whitespace-nowrap">{String(value)}</span>;
}
