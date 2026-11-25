/**
 * In-memory weekly-goal fake for use-case unit tests.
 *
 * Keys rows by `${studentId}:${weekKey}`, mirroring the compound unique
 * constraint. `incrementTestsDone` is additive (no lost updates in tests
 * either, since the real repo is atomic and this fake mirrors its shape).
 */

import type { WeeklyGoal } from "@/modules/advising/domain/models";
import type { WeeklyGoalRepositoryPort } from "@/modules/advising/domain/ports";

export class FakeWeeklyGoalRepository implements WeeklyGoalRepositoryPort {
  private readonly rows = new Map<string, WeeklyGoal>();
  private readonly testRecords = new Map<string, number>();
  private sequence = 0;

  /** Test-only seeding bypasses the upsert path. */
  seed(goal: WeeklyGoal): void {
    this.rows.set(`${goal.studentId}:${goal.weekKey}`, goal);
  }

  /** Test-only seeding of per-subject test counts. */
  seedTestRecord(studentId: string, weekKey: string, subject: string, count: number): void {
    this.testRecords.set(`${studentId}:${weekKey}:${subject}`, count);
  }

  async findByKey(
    studentId: string,
    weekKey: string,
  ): Promise<WeeklyGoal | null> {
    return this.rows.get(`${studentId}:${weekKey}`) ?? null;
  }

  async listInRange(
    studentId: string,
    fromWeekKey: string,
    toWeekKey: string,
  ): Promise<WeeklyGoal[]> {
    return [...this.rows.values()].filter(
      (r) =>
        r.studentId === studentId &&
        r.weekKey >= fromWeekKey &&
        r.weekKey <= toWeekKey,
    );
  }

  async setCompletedBlocks(
    studentId: string,
    weekKey: string,
    blocks: readonly string[],
  ): Promise<WeeklyGoal> {
    const key = `${studentId}:${weekKey}`;
    const existing = this.rows.get(key);
    if (!existing) throw new Error("weekly goal not found");
    const next: WeeklyGoal = {
      ...existing,
      completedBlocks: [...blocks],
      updatedAt: new Date(),
    };
    this.rows.set(key, next);
    return next;
  }

  async incrementTestsDone(
    studentId: string,
    weekKey: string,
    delta: number,
  ): Promise<WeeklyGoal> {
    const key = `${studentId}:${weekKey}`;
    const existing = this.rows.get(key);
    const now = new Date();
    if (!existing) {
      this.sequence += 1;
      const row: WeeklyGoal = {
        id: `weekly-goal-${this.sequence}`,
        studentId,
        weekKey,
        testsDone: delta,
        completedBlocks: [],
        createdAt: now,
        updatedAt: now,
      };
      this.rows.set(key, row);
      return row;
    }
    const next: WeeklyGoal = {
      ...existing,
      testsDone: existing.testsDone + delta,
      updatedAt: now,
    };
    this.rows.set(key, next);
    return next;
  }

  async incrementSubjectTests(input: {
    studentId: string;
    weekKey: string;
    subject: string;
    count: number;
  }): Promise<void> {
    const key = `${input.studentId}:${input.weekKey}`;
    const now = new Date();
    const existing = this.rows.get(key);
    if (!existing) {
      this.sequence += 1;
      const row: WeeklyGoal = {
        id: `weekly-goal-${this.sequence}`,
        studentId: input.studentId,
        weekKey: input.weekKey,
        testsDone: input.count,
        completedBlocks: [],
        createdAt: now,
        updatedAt: now,
      };
      this.rows.set(key, row);
    } else {
      const next: WeeklyGoal = {
        ...existing,
        testsDone: existing.testsDone + input.count,
        updatedAt: now,
      };
      this.rows.set(key, next);
    }
    const testKey = `${input.studentId}:${input.weekKey}:${input.subject}`;
    this.testRecords.set(testKey, (this.testRecords.get(testKey) ?? 0) + input.count);
  }

  async listSubjectTests(input: {
    studentId: string;
    weekKey: string;
  }): Promise<{ subject: string; count: number }[]> {
    const prefix = `${input.studentId}:${input.weekKey}:`;
    const result: { subject: string; count: number }[] = [];
    for (const [testKey, count] of this.testRecords) {
      if (testKey.startsWith(prefix)) {
        result.push({ subject: testKey.slice(prefix.length), count });
      }
    }
    return result;
  }
}
