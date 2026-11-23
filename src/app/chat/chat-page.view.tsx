import type { RefObject } from "react";
import { Button, Input, Card, Avatar } from "antd";
import type { ChatMessage } from "./chat-page.vm";
import type { SearchResult } from "@/modules/rag/domain/models";

interface ChatPageViewProps {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  streaming: boolean;
  sendMessage: (e: React.FormEvent) => void;
  stopStream: () => void;
  regenerate: () => void;
  msgEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatPageView(props: ChatPageViewProps): React.ReactNode {
  const {
    messages,
    input,
    setInput,
    streaming,
    sendMessage,
    stopStream,
    regenerate,
    msgEndRef,
  } = props;

  return (
    <div className="flex flex-col h-dvh max-w-4xl mx-auto p-2 md:p-4">
      <Card
        className="flex-1 flex flex-col border-slate-200 shadow-sm"
        title={
          <div className="flex items-center gap-4 p-4 border-b border-slate-200">
            <span className="text-xl">📎</span>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-800">mr-dan مشاور</h1>
              <p className="text-xs text-slate-500">
                پاسخ بر اساس اسناد آپلود شده
              </p>
            </div>
          </div>
        }
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              پیام خود را بنویسید تا مشاوره شروع شود.
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-3`}
            >
              <Avatar size="small" shape="square" className="mt-1">
                {m.role === "user" ? "U" : "A"}
              </Avatar>
              <Card
                className={`max-w-[85%] p-3 rounded-lg ${
                  m.role === "user"
                    ? "bg-teal-50 border-teal-200 text-slate-800 ml-4"
                    : "bg-white border-slate-200 text-slate-900 mr-4"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/50">
                    <div className="text-xs font-semibold text-teal-700 mb-1">
                      منابع:
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                      {m.sources.slice(0, 3).map((s: SearchResult, i: number) => (
                        <li key={i}>
                          {String(
                            s.chunk.metadata["original_filename"] ??
                              s.chunk.metadata["source"],
                          )} — {s.chunk.text.slice(0, 100)}…
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          ))}
          {streaming && (
            <div className="flex justify-start gap-3">
              <Avatar size="small" shape="square" className="mt-1">A</Avatar>
              <div className="flex items-center gap-2 animate-pulse">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <span className="text-sm text-slate-500">
                  پاسخ در حال دریافت…
                </span>
              </div>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>
        <form onSubmit={sendMessage} className="p-4 border-t border-slate-200 bg-white">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پرسش خود را بنویسید..."
              disabled={streaming}
            />
            <Button
              htmlType="submit"
              disabled={streaming || !input.trim()}
              className="px-4"
            >
              ارسال
            </Button>
            {streaming ? (
              <Button danger onClick={stopStream} className="px-4">
                توقف
              </Button>
            ) : messages.length > 0 ? (
              <Button onClick={regenerate} className="px-4">
                بازسازی
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
