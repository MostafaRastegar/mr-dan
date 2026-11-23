import { describe, expect, it } from "vitest";

import { BOOKS, pickBook } from "./books";
import { LEISURE_CODES } from "./leisure";

describe("pickBook", () => {
  it("book recommendation", () => {
    // Field-specific offer wins when it appears earlier in catalog order.
    const specific = pickBook({ field: "ریاضی فیزیک", code: "heavy_workload" });
    expect(specific.id).toBe("how-to-solve-it");
    expect(specific.field).toBe("ریاضی فیزیک");

    // Deterministic: the same input returns the same book.
    expect(pickBook({ field: "ریاضی فیزیک", code: "heavy_workload" })).toEqual(specific);

    // Field-agnostic fallback when the field-specific offer does not cover the code.
    const fallback = pickBook({ field: "علوم تجربی", code: "critical_fatigue" });
    expect(fallback.field).toBeNull();
    expect(fallback.codes).toContain("critical_fatigue");

    // A null field never picks a field-specific book.
    const agnostic = pickBook({ field: null, code: "overloaded_week" });
    expect(agnostic.field).toBeNull();
    expect(agnostic.codes).toContain("overloaded_week");
  });

  it("every leisure code has a book", () => {
    for (const code of LEISURE_CODES) {
      const book = pickBook({ field: null, code });
      expect(BOOKS).toContain(book);
      expect(book.codes).toContain(code);
    }
  });
});
