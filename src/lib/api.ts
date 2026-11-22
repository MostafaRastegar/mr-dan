/**
 * Thin API client for the frontend.
 *
 * Uses relative URLs (same origin) so no NEXT_PUBLIC_API_BASE is needed.
 */

async function request(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    signal: init.signal ?? controller.signal,
  });

  clearTimeout(timeout);
  return res;
}

export async function apiGet(path: string): Promise<unknown> {
  const res = await request(path, { method: "GET" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiDelete(path: string): Promise<unknown> {
  const res = await request(path, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/** Stream SSE events from a path, invoking onEvent for each parsed event. */
export async function streamEvents(
  path: string,
  body: unknown,
  onEvent: (event: string, data: unknown) => void,
  options?: { signal?: AbortSignal },
): Promise<void> {
  const res = await request(path, {
    method: "POST",
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(await res.text());
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      if (options?.signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            onEvent(currentEvent, JSON.parse(data));
          } catch {
            onEvent(currentEvent, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
