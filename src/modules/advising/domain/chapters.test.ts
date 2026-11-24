import { describe, expect, it } from "vitest";

import {
  chapterAppliesTo,
  chapterIdsAreValid,
  dedupeChapterIds,
} from "./chapters";
import type { Chapter } from "./models";

const chapter: Chapter = {
  id: "ch-1",
  subject: "riazi",
  field: "",
  grade: "دهم",
  number: 1,
  title: "فصل ۱",
  active: true,
};

const target = { subject: "riazi", grade: "دهم", field: null };

describe("chapterAppliesTo", () => {
  it("accepts same subject + grade with field: ''", () => {
    expect(chapterAppliesTo(chapter, target)).toBe(true);
  });

  it("rejects inactive chapter", () => {
    expect(chapterAppliesTo({ ...chapter, active: false }, target)).toBe(false);
  });

  it("rejects another subject", () => {
    expect(
      chapterAppliesTo({ ...chapter, subject: "fizik" }, target),
    ).toBe(false);
  });

  it("rejects another grade", () => {
    expect(
      chapterAppliesTo({ ...chapter, grade: "یازدهم" }, { ...target, grade: "یازدهم" }),
    ).toBe(false);
  });

  it("rejects missing grade", () => {
    expect(chapterAppliesTo(chapter, { ...target, grade: null })).toBe(false);
  });

  it("rejects another non-empty field", () => {
    expect(
      chapterAppliesTo(
        { ...chapter, field: "ریاضی فیزیک" },
        { ...target, field: "علوم تجربی" },
      ),
    ).toBe(false);
  });

  it("accepts field: '' chapter for any student field", () => {
    expect(
      chapterAppliesTo({ ...chapter, field: "" }, { ...target, field: "ریاضی فیزیک" }),
    ).toBe(true);
  });

  it("accepts matching non-empty field", () => {
    expect(
      chapterAppliesTo(
        { ...chapter, field: "علوم تجربی" },
        { ...target, field: "علوم تجربی" },
      ),
    ).toBe(true);
  });
});

describe("chapterIdsAreValid", () => {
  it("accepts all valid ids", () => {
    const catalog = [chapter];
    expect(chapterIdsAreValid([chapter.id], catalog, target)).toBe(true);
  });

  it("rejects unknown id", () => {
    const catalog = [chapter];
    expect(chapterIdsAreValid(["nope"], catalog, target)).toBe(false);
  });

  it("rejects inactive chapter id", () => {
    const catalog = [{ ...chapter, active: false }];
    expect(chapterIdsAreValid([chapter.id], catalog, target)).toBe(false);
  });

  it("rejects another subject chapter", () => {
    const catalog = [{ ...chapter, subject: "fizik" }];
    expect(chapterIdsAreValid([chapter.id], catalog, target)).toBe(false);
  });

  it("rejects another grade chapter", () => {
    const catalog = [{ ...chapter, grade: "یازدهم" }];
    expect(chapterIdsAreValid([chapter.id], catalog, target)).toBe(false);
  });

  it("rejects another field chapter", () => {
    const catalog = [{ ...chapter, field: "ریاضی فیزیک" }];
    expect(
      chapterIdsAreValid([chapter.id], catalog, { ...target, field: "علوم تجربی" }),
    ).toBe(false);
  });

  it("empty list is valid", () => {
    expect(chapterIdsAreValid([], [], target)).toBe(true);
  });
});

describe("dedupeChapterIds", () => {
  it("keeps first-seen order and collapses repeats", () => {
    expect(dedupeChapterIds(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
  });

  it("returns empty for empty input", () => {
    expect(dedupeChapterIds([])).toEqual([]);
  });

  it("returns single element unchanged", () => {
    expect(dedupeChapterIds(["only"])).toEqual(["only"]);
  });
});
