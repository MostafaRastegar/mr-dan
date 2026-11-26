import type { RefObject } from "react";
import { Button, Card, Input, List, Space } from "antd";
import type { ColumnType } from "antd/es/table";
import { ResponsiveTable } from "@/app/_components/responsive-table";
import type { DocumentRow, Stats, SearchResultItem } from "./knowledge-page.vm";

interface KnowledgePageViewProps {
  docs: DocumentRow[];
  stats: Stats | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  searchResults: SearchResultItem[];
  loading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIngest: (filePath: string, originalFilename: string, fileType: string) => void;
  onSearch: () => void;
  onClearCache: () => void;
  onLoadDocs: () => void;
  columns: ColumnType<DocumentRow>[];
}

export function KnowledgePageView(props: KnowledgePageViewProps): React.ReactNode {
  const {
    docs,
    stats,
    searchQuery,
    setSearchQuery,
    searchResults,
    loading,
    fileInputRef,
    onUpload,
    onIngest,
    onSearch,
    onClearCache,
    onLoadDocs,
    columns,
  } = props;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <Card title="مدیریت دانش" extra={<span>آپلود، لیست، جستجو و پاک کردن کش</span>}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="فایل را انتخاب کنید…"
              readOnly
              value={fileInputRef.current?.files?.[0]?.name ?? ""}
              className="w-48"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={onUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              بارگذاری فایل
            </Button>
          </div>
          {loading && <div className="text-xs text-slate-500">در حال بارگذاری…</div>}

          <Space.Compact>
            <Input
              placeholder="مسیر فایل برای ingestion"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56"
            />
            <Button
              onClick={() =>
                onIngest(
                  searchQuery,
                  searchQuery.split("/").pop() ?? searchQuery,
                  "txt",
                )
              }
              disabled={loading || !searchQuery.trim()}
            >
              Ingest
            </Button>
          </Space.Compact>

          <Button onClick={onLoadDocs} disabled={loading}>
            بازخوانی لیست
          </Button>
          <Button onClick={onClearCache} disabled={loading} danger>
            پاک‌سازی کش
          </Button>
        </div>
      </Card>

      <Card title="آمار سیستم">
        {stats ? (
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">اسناد</dt>
              <dd className="text-2xl font-bold">{stats.documents}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">چانک‌ها</dt>
              <dd className="text-2xl font-bold">{stats.chunks}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">مکالمه‌ها</dt>
              <dd className="text-2xl font-bold">{stats.conversations}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">کیش (دقیق/ماهیتی)</dt>
              <dd className="text-2xl font-bold">
                {stats.cache.exact}/{stats.cache.semantic}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="text-sm text-slate-400">در حال بارگذاری آمار…</div>
        )}
      </Card>

      <Card title="لیست اسناد">
        <ResponsiveTable
          rowKey="id"
          columns={columns}
          dataSource={docs}
          size="middle"
          emptyText="سندی یافت نشد"
        />
      </Card>

      <Card title="جستجوی مستقیم">
        <Space.Compact className="w-full sm:w-96">
          <Input
            placeholder="سوال را بنویسید…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={onSearch}
          />
          <Button
            type="primary"
            onClick={onSearch}
            disabled={loading || !searchQuery.trim()}
          >
            جستجو
          </Button>
        </Space.Compact>
        {searchResults.length > 0 && (
          <List
            className="mt-4"
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={String(
                    item.chunk.metadata["original_filename"] ??
                      item.chunk.metadata["source"],
                  )}
                  description={item.chunk.text}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
