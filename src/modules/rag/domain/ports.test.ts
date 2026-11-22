import { describe, expect, it } from "vitest";
import { FakeHealthProbe } from "@/test/health-probe";

describe("FakeHealthProbe", () => {
  it("resolves when healthy", async () => {
    await expect(new FakeHealthProbe("postgres").check()).resolves.toBeUndefined();
  });

  it("throws when configured to fail", async () => {
    await expect(new FakeHealthProbe("chroma", true).check()).rejects.toThrow(
      "chroma unavailable",
    );
  });
});
