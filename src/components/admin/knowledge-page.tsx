"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  List,
  Row,
  Table,
  Space,
  notification,
} from "antd";
import {
  apiDelete,
  apiGet,
  apiPost,
} from "@/lib/api";

interface DocumentRow {
  id: string;
  filename: string;
  originalFilename: string;
  sourcePath: string;
  fileType: string;
  chunkCount: number;
  ingestedAt: string;
}

interface Stats {
  documents: number;
  chunks: number;
  conversations: number;
  cache: { exact: number; semantic: number };
  upstream: Record<string, string>;
}

interface SearchResultItem {
  chunk: {
    metadata: Record<string, unknown>;
    text: string;
  };
}

export function KnowledgePage(): React.ReactNode {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const data = await apiGet("/api/documents");
      setDocs((data as { data?: DocumentRow[] }).data ?? []);
    } catch {
      // silent
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGet("/api/admin/stats");
      setStats((data as { data?: Stats }).data ?? null);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadDocs();
    loadStats();
  }, [loadDocs, loadStats]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      await loadDocs();
      loadStats();
      notification.success({ message: "بارگذاری انجام شد" });
    } catch (err) {
      notification.error({ message: "خطا در بارگذاری: " + (err as Error).message });
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleIngest = async (filePath: string, originalFilename: string, fileType: string) => {
    setLoading(true);
    try {
      await apiPost("/api/ingest", {
        filePath,
        originalFilename,
        fileType: fileType as "json" | "md" | "txt" | "pdf",
      });
      await loadDocs();
      loadStats();
      notification.success({ message: "فایل ingestion شد" });
    } catch (err) {
      notification.error({
        message: "خطا در ingestion: " + (err as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await apiDelete(`/api/documents/${id}`);
      await loadDocs();
      loadStats();
      notification.success({ message: "حذف شد" });
    } catch (err) {
      notification.error({ message: "خطا در حذف: " + (err as Error).message });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await apiPost("/api/search", {
        question: searchQuery,
        topK: 5,
      });
      setSearchResults((data as { answer?: { sources?: SearchResultItem[] } }).answer?.sources ?? []);
    } catch (err) {
      notification.error({ message: "خطا در جستجو: " + (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await apiPost("/api/admin/cache/clear", {});
      notification.success({ message: "کیش پاک شد" });
      loadStats();
    } catch (err) {
      notification.error({ message: "خطا در پاک کردن کش: " + (err as Error).message });
    }
  };

  const columns = [
    {
      title: "نام فایل",
      dataIndex: "originalFilename",
      key: "originalFilename",
    },
    {
      title: "نوع",
      dataIndex: "fileType",
      key: "fileType",
    },
    {
      title: "تعداد چانک",
      dataIndex: "chunkCount",
      key: "chunkCount",
    },
    {
      title: "تاریخ",
      dataIndex: "ingestedAt",
      key: "ingestedAt",
    },
    {
      title: "عملیات",
      key: "action",
      render: (_: unknown, record: DocumentRow) => (
        <Button
          danger
          onClick={() => handleDeleteDoc(record.id)}
          size="small"
        >
          حذف
        </Button>
      ),
    },
  ];

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
                  onChange={handleUpload}
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
              <Input.Group compact className="w-full">
                <Input
                  placeholder="مسیر فایل برای ingestion"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  onClick={() =>
                    handleIngest(
                      searchQuery,
                      searchQuery.split("/").pop() ?? searchQuery,
                      "txt",
                    )
                  }
                  disabled={loading || !searchQuery.trim()}
                >
                  Ingest
                </Button>
              </Input.Group>
            </Col>
            <Col lg={8} md={12}>
              <Space direction="vertical" className="w-full" size="middle">
                <Button onClick={loadDocs} disabled={loading}>
                  بازخوانی لیست
                </Button>
                <Button onClick={handleClearCache} disabled={loading} danger>
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
                onPressEnter={handleSearch}
              />
            </Col>
            <Col lg={2} md={4}>
              <Button
                type="primary"
                onClick={handleSearch}
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
