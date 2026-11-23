"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { message } from "antd";
import type { SearchResult } from "@/modules/rag/domain/models";
import { streamEvents } from "@/lib/api";

import { ChatPageView } from "./chat-page.view";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
  streaming?: boolean;
}

export function ChatPageWrapper(): React.ReactNode {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentInputRef = useRef(input);
  currentInputRef.current = input;

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const text = currentInputRef.current.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    currentInputRef.current = "";

    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setStreaming(true);

    abortRef.current = new AbortController();

    try {
      let fullText = "";
      let sources: SearchResult[] = [];

      await streamEvents(
        "/api/chat/stream",
        { question: text },
        (event, data) => {
          if (abortRef.current?.signal.aborted) return;
          switch (event) {
            case "token":
              fullText += String(data);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullText } : m,
                ),
              );
              break;
            case "sources":
              sources = data as SearchResult[];
              break;
            case "done":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: fullText, sources, streaming: false }
                    : m,
                ),
              );
              setStreaming(false);
              break;
            case "error":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: String(data), streaming: false }
                    : m,
                ),
              );
              setStreaming(false);
              break;
          }
        },
        { signal: abortRef.current.signal },
      );
    } catch {
      if (abortRef.current?.signal.aborted) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "خطا در دریافت پاسخ. لطفاً دوباره تلاش کنید.",
                streaming: false,
              }
            : m,
        ),
      );
      setStreaming(false);
      message.error("خطا در ارتباط با سرور");
    } finally {
      abortRef.current = null;
    }
  }, [streaming]);

  const stopStream = () => {
    abortRef.current?.abort();
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  };

  const regenerate = () => {
    const lastUser = messages.findLast((m) => m.role === "user");
    if (!lastUser) return;
    setInput(lastUser.content);
    currentInputRef.current = lastUser.content;
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.role === "assistant");
      if (idx === -1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
    void sendMessage as unknown as () => Promise<void>;
  };

  return (
    <ChatPageView
      messages={messages}
      input={input}
      setInput={setInput}
      streaming={streaming}
      sendMessage={sendMessage}
      stopStream={stopStream}
      regenerate={regenerate}
      msgEndRef={msgEndRef}
    />
  );
}
