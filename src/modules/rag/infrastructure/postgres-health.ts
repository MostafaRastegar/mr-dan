import type { HealthProbe } from "@/modules/rag/domain/ports";
import { prisma } from "@/shared/prisma";

export class PostgresHealthProbe implements HealthProbe {
  readonly name = "postgres";

  async check(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  }
}
