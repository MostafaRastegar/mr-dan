import type { RefObject } from "react";
import { Button, Input } from "antd";
import { IconMessage } from "@tabler/icons-react";
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
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <IconMessage size={22} stroke={1.8} aria-hidden="true" />
          مشاور هوشمند
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          پاسخ بر اساس اسناد آپلودشده
        </p>
      </header>

      <section className="flex h-[62dvh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div
          className="flex-1 overflow-y-auto p-4"
          role="log"
          aria-live="polite"
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              پیام خود را بنویسید تا مشاوره شروع شود.
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mb-3 flex ${
                m.role === "user" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === "user"
                    ? "bg-teal-600 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-900"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 border-t border-slate-200 pt-2">
                    <div className="mb-1 text-xs font-semibold text-teal-700">
                      منابع:
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
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
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex items-center gap-2 motion-reduce:animate-none">
              <span className="size-2.5 animate-pulse rounded-full bg-teal-500" />
              <span className="text-sm text-slate-500">
                پاسخ در حال دریافت…
              </span>
            </div>
          )}
          <div ref={msgEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-slate-200/70 p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="پرسش خود را بنویسید…"
              aria-label="پرسش شما"
              disabled={streaming}
            />
            <Button
              type="primary"
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
      </section>
    </div>
  );
}
