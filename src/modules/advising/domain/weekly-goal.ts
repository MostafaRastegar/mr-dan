/**
 * Weekly goal progress: studied minutes and test count versus the weekly
 * targets. Targets are passed in by the caller (from the study plan header
 * or zero when no plan exists). Every `completedBlocks` entry lives on the
 * weekly row, so it belongs to `goal.weekKey` (the current Iran week).
 * Percent is clamped at 100 while the raw numbers stay truthful.
 *
 * Pure domain: no external imports.
 */

import type { WeeklyGoal, WeeklyScheduleEntry } from "./models";
import { parseStudyBlockKey } from "./study-blocks";
import { persianDayOf } from "./day-key";

export type GoalProgress = {
  studyMinutes: number;
  studyMinutesTarget: number;
  testsDone: number;
  testsTarget: number;
  studyPercent: number;
  testsPercent: number;
};

export type GoalTargets = {
  studyMinutesTarget: number;
  testsTarget: number;
};

export function goalProgress(
  goal: WeeklyGoal | null,
  targets: GoalTargets,
): GoalProgress {
  const g: WeeklyGoal = goal ?? {
    id: "",
    studentId: "",
    weekKey: "",
    testsDone: 0,
    completedBlocks: [],
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };

  let studyMinutes = 0;
  for (const block of g.completedBlocks) {
    const parsed = parseStudyBlockKey(block);
    if (parsed) studyMinutes += parsed.minutes;
  }

  return {
    studyMinutes,
    studyMinutesTarget: targets.studyMinutesTarget,
    testsDone: g.testsDone,
    testsTarget: targets.testsTarget,
    studyPercent: clampPercent(studyMinutes, targets.studyMinutesTarget),
    testsPercent: clampPercent(g.testsDone, targets.testsTarget),
  };
}

/** todayKey is part of the contract signature; progress is whole-week so it
 * is not used to filter blocks. Callers pass the current Iran day. */
function clampPercent(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

/** Maps each completed study block to the schedule row it falls inside, then
 * sums minutes per schedule subject. Blocks that hit no schedule row (or fall
 * outside the plan) are intentionally omitted here — callers keep them in
 * totals via `goalProgress.studyMinutes`. Pure domain, no external imports. */
export function subjectStudiedMinutes(
  completedBlocks: string[],
  schedule: WeeklyScheduleEntry[],
): Record<string, number> {
  const bySubject: Record<string, number> = {};
  for (const blockKey of completedBlocks) {
    const parsed = parseStudyBlockKey(blockKey);
    if (!parsed) continue;
    const row = schedule.find(
      (s) =>
        s.dayOfWeek === persianDayOf(parsed.dayKey) &&
        s.startMinute <= parsed.startMinute &&
        parsed.startMinute < s.endMinute,
    );
    if (!row) continue;
    bySubject[row.subject] = (bySubject[row.subject] ?? 0) + parsed.minutes;
  }
  return bySubject;
}
