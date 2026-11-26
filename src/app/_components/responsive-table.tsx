import { useState } from "react";
import { Empty, Table } from "antd";
import type { TableProps } from "antd";
import type { ReactNode } from "react";
import type { ColumnType } from "antd/es/table";

type Row = Record<string, unknown>;

interface ResponsiveTableProps<T extends object> {
  testId?: string;
  rowKey: keyof T & string;
  dataSource: readonly T[];
  columns: NonNullable<TableProps<T>["columns"]>;
  emptyText: string;
  loading?: boolean;
  pagination?: TableProps["pagination"];
  size?: TableProps["size"];
}

/** Same data, two renderings: AntD Table on desktop, stacked cards on
 *  mobile (no horizontal scroll). Cards reuse the columns' own render
 *  functions; the "عملیات" column becomes the card's action row. */
export function ResponsiveTable<T extends object>({
  testId,
  rowKey,
  dataSource,
  columns,
  emptyText,
  loading,
  pagination,
  size,
}: ResponsiveTableProps<T>): ReactNode {
  const flat = columns as ColumnType<T>[];
  const actionCol = flat.find((column) => column.title === "عملیات");
  const dataCols = flat.filter((column) => column !== actionCol);
  const [primary, ...fields] = dataCols;

  // Mobile cards: slice locally when nothing paginates upstream, otherwise
  // trust the caller (server-side pages arrive pre-sliced) and page via it.
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const serverPager =
    pagination &&
    typeof pagination === "object" &&
    typeof pagination.total === "number" &&
    pagination.total > 0
      ? (pagination as { total: number; current?: number; pageSize?: number; onChange?: (page: number, pageSize: number) => void })
      : null;
  const totalPages = serverPager
    ? Math.max(1, Math.ceil(serverPager.total / (serverPager.pageSize ?? pageSize)))
    : Math.max(1, Math.ceil(dataSource.length / pageSize));
  const localPage = Math.min(currentPage, totalPages);
  const page = serverPager ? serverPager.current ?? 1 : localPage;
  const mobileRows = serverPager
    ? dataSource
    : dataSource.slice((page - 1) * pageSize, page * pageSize);
  const goto = (next: number) => {
    if (serverPager?.onChange) {
      serverPager.onChange(next, serverPager.pageSize ?? pageSize);
    } else {
      setCurrentPage(next);
    }
  };

  const cell = (row: T, column: ColumnType<T>, fallback: string): ReactNode => {
    const raw = column.dataIndex ? (row as Row)[String(column.dataIndex)] : row;
    if (column.render) {
      return (column.render(raw, row, 0) ?? null) as ReactNode;
    }
    const text = typeof raw === "string" || typeof raw === "number" ? raw : null;
    if (text === null) return <span className="text-slate-400">{fallback}</span>;
    return text;
  };

  return (
    <>
      <div className="hidden md:block">
        <Table<T>
          rowKey={rowKey}
          columns={columns}
          dataSource={[...dataSource]}
          loading={loading}
          size={size}
          pagination={pagination}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: <Empty description={emptyText} /> }}
          data-testid={testId}
        />
      </div>
      <ul
        className="grid gap-3 md:hidden"
        data-testid={testId ? `${testId}-card` : undefined}
      >
        {dataSource.length === 0 ? (
          <li className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {emptyText}
          </li>
        ) : null}
        {mobileRows.map((row) => (
          <li
            key={String((row as Row)[rowKey])}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="text-[15px] font-semibold text-slate-900">
              {primary ? cell(row, primary, "—") : String((row as Row)[rowKey])}
            </div>
            <dl className="mt-2 grid gap-1.5">
              {fields.map((column) => (
                <div
                  key={String(column.key ?? column.dataIndex)}
                  className="flex items-baseline justify-between gap-3 text-sm"
                >
                  <dt className="shrink-0 text-slate-500">
                    {typeof column.title === "string" ? column.title : ""}
                  </dt>
                  <dd className="min-w-0 text-right [&_.ant-tag]:m-0">
                    {cell(row, column, "—")}
                  </dd>
                </div>
              ))}
            </dl>
            {actionCol ? (
              <div className="mt-3 border-t border-slate-200/70 pt-2 [&_button]:h-8 [&_button]:px-2">
                {cell(row, actionCol, "")}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 pb-2 text-sm text-slate-600 md:hidden">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => goto(page - 1)}
            className="min-h-[44px] rounded-lg px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-40"
          >
            قبلی
          </button>
          <span>
            صفحه {page} از {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => goto(page + 1)}
            className="min-h-[44px] rounded-lg px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-40"
          >
            بعدی
          </button>
        </div>
      ) : null}
    </>
  );
}
