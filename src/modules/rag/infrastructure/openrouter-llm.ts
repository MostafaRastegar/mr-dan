/**
 * OpenRouter chat LLM provider.
 *
 * Calls OpenRouter's chat/completions endpoint with retry + backoff.
 * Supports both single-shot completion and token streaming.
 */

import { env } from "@/shared/env";
import { logger } from "@/shared/logger";
import { UpstreamError } from "@/modules/rag/domain/errors";
import type { LLMPort } from "@/modules/rag/domain/ports";

export class OpenRouterLLMProvider implements LLMPort {
  private readonly baseURL: string;
  private readonly model: string;
  private readonly apiKey: string;
  private readonly maxRetries: number;

  constructor(options: {
    baseURL?: string;
    model?: string;
    apiKey?: string;
    maxRetries?: number;
  } = {}) {
    this.baseURL = options.baseURL ?? env.OPENROUTER_BASE_URL;
    this.model = options.model ?? env.LLM_MODEL;
    this.apiKey = options.apiKey ?? env.OPENROUTER_API_KEY;
    this.maxRetries = options.maxRetries ?? env.LLM_RETRY_ATTEMPTS;
  }

  async complete(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    let chunks: string[] = [];
    await this.completeStream(messages, (token) => {
      chunks.push(token);
    });
    return chunks.join("");
  }

  async completeStream(
    messages: { role: string; content: string }[],
    onToken: (token: string) => void,
    options?: { signal?: AbortSignal },
  ): Promise<void> {
    const url = `${this.baseURL.replace(/\/$/, "")}/chat/completions`;
    const body = JSON.stringify({
      model: this.model,
      messages,
      stream: true,
      temperature: 0,
    });
    const signal = options?.signal;

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      if (signal?.aborted) return;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          env.LLM_TIMEOUT_SECONDS * 1000,
        );

        // When the HTTP request aborts (client disconnected), close the
        // upstream fetch/reader too so nothing leaks.
        if (signal) {
          signal.addEventListener(
            "abort",
            () => controller.abort(),
            { once: true },
          );
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new UpstreamError("OpenRouter chat", {
            status: response.status,
            body: text,
          });
        }

        if (!response.body) {
          throw new UpstreamError("OpenRouter chat: no response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            if (signal?.aborted) return;
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data:")) continue;
              const data = trimmed.slice(5).trim();
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta =
                  parsed.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  onToken(delta);
                }
              } catch {
                // ignore malformed SSE lines
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        return; // success
      } catch (error) {
        if (signal?.aborted) return;
        lastError = error;
        if (attempt < this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          logger.warn(
            { err: error, attempt, backoff },
            "chat request failed, retrying",
          );
          await new Promise((resolve) => setTimeout(resolve, backoff));
        }
      }
    }

    throw new UpstreamError("OpenRouter chat", lastError);
  }
}
