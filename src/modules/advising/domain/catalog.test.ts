import { describe, expect, it } from "vitest";

import {
  labelOf,
  pickBookFrom,
  subjectLabelMap,
  subjectOptions,
} from "./catalog";
import type { BookRow, SubjectRow } from "./models";

function subject(overrides: Partial<SubjectRow> & { slug: string }): SubjectRow {
  return {
    id: overrides.slug,
    label: overrides.slug,
    fieldLabels: [],
    gradeLabels: [],
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

function book(overrides: Partial<BookRow> & { slug: string }): BookRow {
  return {
    id: overrides.slug,
    title: overrides.slug,
    author: "author",
    fieldLabel: null,
    codes: [],
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("subjectLabelMap / labelOf", () => {
  it("maps slugs to labels including retired rows", () => {
    const labels = subjectLabelMap([
      subject({ slug: "riazi", label: "ریاضی" }),
      subject({ slug: "honar", label: "هنر", active: false }),
    ]);

    expect(labels).toEqual({ riazi: "ریاضی", honar: "هنر" });
  });

  it("falls back to the stored slug for unknown values", () => {
    expect(labelOf({ riazi: "ریاضی" }, "riazi")).toBe("ریاضی");
    expect(labelOf({ riazi: "ریاضی" }, "legacy-slug")).toBe("legacy-slug");
    expect(labelOf({}, "")).toBe("");
  });
});

describe("subjectOptions", () => {
  const rows = [
    subject({ slug: "quran", label: "قرآن", sortOrder: 0 }),
    subject({ slug: "fizik", label: "فیزیک", fieldLabels: ["علوم تجربی"], sortOrder: 1 }),
    subject({ slug: "zist", label: "زیست", fieldLabels: ["علوم تجربی"], gradeLabels: ["دوازدهم"], sortOrder: 2 }),
    subject({ slug: "honar", label: "هنر", active: false, sortOrder: 3 }),
  ];

  it("empty fieldLabels means every field; empty gradeLabels every grade", () => {
    const options = subjectOptions(rows, { field: "ریاضی فیزیک", grade: "دهم" });
    expect(options.map((o) => o.slug)).toEqual(["quran"]);
  });

  it("includes field-matching subjects and excludes retired rows", () => {
    const options = subjectOptions(rows, { field: "علوم تجربی", grade: null });
    expect(options.map((o) => o.slug)).toEqual(["quran", "fizik", "zist"]);
  });

  it("null field returns general subjects only", () => {
    const options = subjectOptions(rows, { field: null, grade: null });
    expect(options.map((o) => o.slug)).toEqual(["quran"]);
  });

  it("filters grade membership when the row declares one", () => {
    const tenth = subjectOptions(rows, { field: "علوم تجربی", grade: "دهم" });
    const twelfth = subjectOptions(rows, { field: "علوم تجربی", grade: "دوازدهم" });
    expect(tenth.map((o) => o.slug)).toEqual(["quran", "fizik"]);
    expect(twelfth.map((o) => o.slug)).toEqual(["quran", "fizik", "zist"]);
  });
});

describe("pickBookFrom", () => {
  it("prefers the first field-specific or agnostic match in row order", () => {
    const rows = [
      book({ slug: "specific", fieldLabel: "ریاضی فیزیک", codes: ["heavy_workload"] }),
      book({ slug: "agnostic", codes: ["heavy_workload"] }),
    ];

    expect(pickBookFrom(rows, { field: "ریاضی فیزیک", code: "heavy_workload" })?.slug).toBe("specific");
    expect(pickBookFrom(rows, { field: null, code: "heavy_workload" })?.slug).toBe("agnostic");
  });

  it("tie-break is the row order (sortOrder then id)", () => {
    // Two books share sortOrder 1; the repository orders by id, so "a" comes first.
    const rows = [
      book({ slug: "a", codes: ["balanced"], sortOrder: 1 }),
      book({ slug: "b", codes: ["balanced"], sortOrder: 1 }),
    ];

    expect(pickBookFrom(rows, { field: null, code: "balanced" })?.slug).toBe("a");
  });

  it("falls back to the first field-agnostic book, then the first book, then null", () => {
    const agnostic = [
      book({ slug: "specific", fieldLabel: "علوم تجربی", codes: ["balanced"] }),
      book({ slug: "agnostic", codes: [] }),
    ];
    expect(pickBookFrom(agnostic, { field: "علوم تجربی", code: "critical_fatigue" })?.slug).toBe("agnostic");

    const onlySpecific = [book({ slug: "specific", fieldLabel: "علوم تجربی", codes: [] })];
    expect(pickBookFrom(onlySpecific, { field: "علوم تجربی", code: "critical_fatigue" })?.slug).toBe("specific");

    expect(pickBookFrom([], { field: null, code: "balanced" })).toBeNull();
  });
});
