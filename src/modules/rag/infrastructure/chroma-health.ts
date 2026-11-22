import type { HealthProbe } from "@/modules/rag/domain/ports";
import { env } from "@/shared/env";

export class ChromaHealthProbe implements HealthProbe {
  readonly name = "chroma";

  async check(): Promise<void> {
    const response = await fetch(`${env.CHROMA_URL}/api/v2/heartbeat`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      throw new Error(`Chroma heartbeat returned ${response.status}`);
    }
  }
}
