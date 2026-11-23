import type { RefObject } from "react";
import { Button, Card, Col, Divider, Input, List, Row, Table, Space } from "antd";
import type { ColumnType } from "antd/es/table";
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
    <div className="max-w-6xl mx-auto p-4">
      <Card className="mb-4" title="مدیریت دانش" extra={<span>آپلود، لیست، جستجو و پاک کردن کش</span>}>
        <div className="p-4">
          <Row gutter={[16, 16]}>
            <Col lg={8} md={12}>
              <div className="flex gap-2">
                <Input
                  placeholder="فایل را انتخاب کنید…"
                  readOnly
                  value={fileInputRef.current?.files?.[0]?.name ?? ""}
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
              {loading && <div className="mt-2 text-xs text-slate-500">در حال بارگذاری…</div>}
            </Col>
            <Col lg={8} md={12}>
              <Space.Compact className="w-full">
                <Input
                  placeholder="مسیر فایل برای ingestion"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
            </Col>
            <Col lg={8} md={12}>
              <Space orientation="vertical" className="w-full" size="middle">
                <Button onClick={onLoadDocs} disabled={loading}>
                  بازخوانی لیست
                </Button>
                <Button onClick={onClearCache} disabled={loading} danger>
                  پاک‌سازی کش
                </Button>
              </Space>
            </Col>
          </Row>
        </div>
      </Card>

      <Divider orientation="horizontal">آمار سیستم</Divider>
      <Card className="mb-4" title="آمار سیستم">
        <div className="p-4">
          {stats ? (
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="text-xs text-slate-500">اسناد</div>
                <div className="text-2xl font-bold">{stats.documents}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs text-slate-500">چانک‌ها</div>
                <div className="text-2xl font-bold">{stats.chunks}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs text-slate-500">مکالمه‌ها</div>
                <div className="text-2xl font-bold">{stats.conversations}</div>
              </Col>
              <Col span={6}>
                <div className="text-xs text-slate-500">کیش (دقیق/ماهیتی)</div>
                <div className="text-2xl font-bold">
                  {stats.cache.exact}/{stats.cache.semantic}
                </div>
              </Col>
            </Row>
          ) : (
            <div className="text-slate-400 text-sm">در حال بارگذاری آمار…</div>
          )}
        </div>
      </Card>

      <Divider orientation="horizontal">لیست اسناد</Divider>
      <Card className="mb-4" title="لیست اسناد">
        <div className="p-4">
          {docs.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">
              سندی یافت نشد.
            </div>
          ) : (
            <Table<DocumentRow>
              rowKey="id"
              columns={columns}
              dataSource={docs}
              size="middle"
              scroll={{ x: "max-content" }}
            />
          )}
        </div>
      </Card>

      <Divider orientation="horizontal">جستجوی مستقیم</Divider>
      <Card title="جستجوی مستقیم">
        <div className="p-4">
          <Row gutter={[16, 16]}>
            <Col lg={10} md={12}>
              <Input
                placeholder="سوال را بنویسید…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={onSearch}
              />
            </Col>
            <Col lg={2} md={4}>
              <Button
                type="primary"
                onClick={onSearch}
                disabled={loading || !searchQuery.trim()}
              >
                جستجو
              </Button>
            </Col>
          </Row>
          {searchResults.length > 0 && (
            <div className="mt-4">
              <List
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
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
