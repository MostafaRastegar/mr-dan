"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, Col, Divider, Input, List, Row, Table, Space, notification } from "antd";
import type { ColumnType } from "antd/es/table";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

import { KnowledgePageView } from "./knowledge-page.view";

export interface DocumentRow {
  id: string;
  filename: string;
  originalFilename: string;
  sourcePath: string;
  fileType: string;
  chunkCount: number;
  ingestedAt: string;
}

export interface Stats {
  documents: number;
  chunks: number;
  conversations: number;
  cache: { exact: number; semantic: number };
  upstream: Record<string, string>;
}

export interface SearchResultItem {
  chunk: {
    metadata: Record<string, unknown>;
    text: string;
  };
}

export function KnowledgePageWrapper(): React.ReactNode {
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
      setSearchResults(
        (data as { data?: { answer?: { sources?: SearchResultItem[] } } }).data
          ?.answer?.sources ?? [],
      );
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

  const columns: ColumnType<DocumentRow>[] = [
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
        <Button danger onClick={() => handleDeleteDoc(record.id)} size="small">
          حذف
        </Button>
      ),
    },
  ];

  return (
    <KnowledgePageView
      docs={docs}
      stats={stats}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
      loading={loading}
      fileInputRef={fileInputRef}
      onUpload={handleUpload}
      onIngest={handleIngest}
      onSearch={handleSearch}
      onClearCache={handleClearCache}
      onLoadDocs={loadDocs}
      columns={columns}
    />
  );
}
