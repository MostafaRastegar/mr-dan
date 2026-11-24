/**
 * Weekly goal progress: studied minutes and test count versus the weekly
 * targets. Targets are passed in by the caller (from the study plan header
 * or zero when no plan exists). Every `completedBlocks` entry lives on the
 * weekly row, so it belongs to `goal.weekKey` (the current Iran week).
 * Percent is clamped at 100 while the raw numbers stay truthful.
 *
 * Pure domain: no external imports.
 */

import type { WeeklyGoal } from "./models";
import { parseStudyBlockKey } from "./study-blocks";

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
