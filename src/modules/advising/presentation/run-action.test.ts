import { describe, expect, it } from "vitest";

import { registerSchema } from "./schemas";
import { runAction } from "./run-action";
import { ValidationError } from "@/shared/errors";

const PERSIAN = /[\u0600-\u06FF]/;

describe("runAction action result contract", () => {
  it("returns ok true with data on success", async () => {
    const result = await runAction(async () => 42);

    expect(result).toEqual({ ok: true, data: 42 });
  });

  it("maps ValidationError to invalid_input with a Persian message", async () => {
    const result = await runAction(async () => {
      throw new ValidationError("مقدار نامعتبر");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
      expect(result.error.message).toMatch(PERSIAN);
    }
  });

  it("maps an unknown thrown value to internal_error without leaking details", async () => {
    const result = await runAction(async () => {
      throw new Error("boom stack detail");
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("internal_error");
      expect(JSON.stringify(result)).not.toContain("boom");
      expect(JSON.stringify(result)).not.toContain("stack");
      expect(result.error.message).toMatch(PERSIAN);
    }
  });

  it("maps a thrown string to internal_error", async () => {
    const result = await runAction(async () => {
      throw "raw failure";
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("internal_error");
      expect(JSON.stringify(result)).not.toContain("raw failure");
    }
  });

  it("turns a zod failure into fieldErrors keyed by field", async () => {
    const result = await runAction(async () =>
      registerSchema.parse({
        username: "ab",
        password: "short",
        role: "student",
        fullName: "",
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("invalid_input");
      expect(result.error.fieldErrors?.username).toMatch(PERSIAN);
      expect(result.error.fieldErrors?.password).toMatch(PERSIAN);
      expect(result.error.fieldErrors?.fullName).toMatch(PERSIAN);
    }
  });
});
