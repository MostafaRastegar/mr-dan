import type { HealthProbe } from "@/modules/rag/domain/ports";

export class FakeHealthProbe implements HealthProbe {
  constructor(
    readonly name: string,
    private readonly fail = false,
  ) {}

  async check(): Promise<void> {
    if (this.fail) {
      throw new Error(`${this.name} unavailable`);
    }
  }
}
