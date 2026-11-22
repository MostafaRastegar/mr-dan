import { ChromaHealthProbe } from "@/modules/rag/infrastructure/chroma-health";
import { PostgresHealthProbe } from "@/modules/rag/infrastructure/postgres-health";

type Container = {
  healthProbes: {
    postgres: PostgresHealthProbe;
    chroma: ChromaHealthProbe;
  };
};

const globalForContainer = globalThis as unknown as {
  __mrDanContainer?: Container;
};

function build(): Container {
  return {
    healthProbes: {
      postgres: new PostgresHealthProbe(),
      chroma: new ChromaHealthProbe(),
    },
  };
}

/**
 * Lazy composition root. Cached on globalThis in dev so HMR does not
 * duplicate adapters and their connections.
 */
export function getContainer(): Container {
  if (!globalForContainer.__mrDanContainer) {
    globalForContainer.__mrDanContainer = build();
  }
  return globalForContainer.__mrDanContainer;
}
