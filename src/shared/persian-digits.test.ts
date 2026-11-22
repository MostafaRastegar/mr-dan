import { describe, expect, it } from "vitest";

import { toAsciiDigits } from "./persian-digits";

describe("toAsciiDigits", () => {
  it("maps Persian digits to ASCII", () => {
    expect(toAsciiDigits("۰۱۲۳۴۵۶۷۸۹")).toBe("0123456789");
  });

  it("maps Arabic-Indic digits to ASCII", () => {
    expect(toAsciiDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("leaves Latin input unchanged", () => {
    expect(toAsciiDigits("student123")).toBe("student123");
  });

  it("keeps non-digit characters in mixed input", () => {
    expect(toAsciiDigits("کاربر۱۲۳@example.com")).toBe("کاربر123@example.com");
  });
});
