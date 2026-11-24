import { describe, expect, it } from "vitest";

import {
  buildStudyBlocks,
  parseStudyBlockKey,
  studyBlockKey,
  type StudyBlock,
} from "./study-blocks";

describe("buildStudyBlocks", () => {
  it("120-minute entry → 50 study / 10 break / 50 study", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 600,
      subject: "riazi",
    });
    expect(blocks).toEqual([
      { dayKey: "2026-11-24", startMinute: 480, minutes: 50, subject: "riazi" },
      { dayKey: "2026-11-24", startMinute: 540, minutes: 50, subject: "riazi" },
    ]);
  });

  it("60-minute entry → one 50-min study plus a 10-min break", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 540,
      subject: "fizik",
    });
    expect(blocks).toEqual([{ dayKey: "2026-11-24", startMinute: 480, minutes: 50, subject: "fizik" }]);
  });

  it("40-minute entry → one 40-minute study block, no break", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 520,
      subject: "adabiat",
    });
    expect(blocks).toEqual([{ dayKey: "2026-11-24", startMinute: 480, minutes: 40, subject: "adabiat" }]);
  });

  it("entry shorter than 50 minutes is one block of its own length", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 495,
      subject: null,
    });
    expect(blocks).toEqual([{ dayKey: "2026-11-24", startMinute: 480, minutes: 15, subject: null }]);
  });

  it("zero-length entry yields no blocks", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 480,
      subject: "riazi",
    });
    expect(blocks).toEqual([]);
  });

  it("subject is copied onto every block", () => {
    const blocks = buildStudyBlocks({
      dayKey: "2026-11-24",
      startMinute: 480,
      endMinute: 600,
      subject: "shimi",
    });
    expect(blocks.every((b) => b.subject === "shimi")).toBe(true);
  });
});

describe("studyBlockKey / parseStudyBlockKey round-trip", () => {
  it("round-trips a block key", () => {
    const block: StudyBlock = {
      dayKey: "2026-11-24",
      startMinute: 480,
      minutes: 50,
      subject: null,
    };
    const key = studyBlockKey(block);
    expect(key).toBe("2026-11-24:480:50");
    expect(parseStudyBlockKey(key)).toEqual(block);
  });

  it("rejects malformed keys", () => {
    expect(parseStudyBlockKey("not-a-key")).toBeNull();
    expect(parseStudyBlockKey("2026-13-01:480:50")).toBeNull();
    expect(parseStudyBlockKey("2026-11-24:480")).toBeNull();
    expect(parseStudyBlockKey("2026-11-24:25:00:50")).toBeNull();
  });
});
