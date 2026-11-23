/**
 * In-memory planning fakes for use-case unit tests.
 *
 * They implement the real ports (never Prisma) so the application layer is
 * tested without a database. Every mutator bumps a write counter that denial
 * tests read (`expect(fake.writes).toBe(0)`). `throwOnCall` lets a test
 * simulate a mapped adapter failure (with `cause`) without a database
 * (testing-parity rule 2).
 */

import {
  NotFoundError,
  ScheduleConflictError,
} from "@/modules/advising/domain/errors";
import type {
  FreeTimeBudget,
  HomeworkFilter,
  HomeworkItem,
  HomeworkPlanEntry,
  NewHomework,
  NewScheduleEntry,
  ScheduleEntryPatch,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import { HOMEWORK_PRIORITY_LABEL, HOMEWORK_PRIORITY_RANK } from "@/modules/advising/domain/models";
import type {
  FreeTimeBudgetRepositoryPort,
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
  ScheduleRepositoryPort,
  UpsertWithinCapacityResult,
  UpsertWithinUsedResult,
} from "@/modules/advising/domain/ports";

export class FakeScheduleRepository implements ScheduleRepositoryPort {
  private readonly rows = new Map<string, WeeklyScheduleEntry>();
  private sequence = 0;
  writes = 0;
  private thrower: unknown = null;

  throwOnCall(next: unknown): void {
    this.thrower = next;
  }

  private maybeThrow(): void {
    if (this.thrower !== null) {
      const err = this.thrower;
      this.thrower = null;
      throw err;
    }
  }

  async listByStudent(studentId: string): Promise<WeeklyScheduleEntry[]> {
    return [...this.rows.values()].filter((r) => r.studentId === studentId).sort(
      (a, b) =>
        (a.dayOfWeek as number) - (b.dayOfWeek as number) ||
        a.startMinute - b.startMinute,
    );
  }

  async findById(id: string): Promise<WeeklyScheduleEntry | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: NewScheduleEntry): Promise<WeeklyScheduleEntry> {
    this.maybeThrow();
    const duplicate = [...this.rows.values()].find(
      (r) =>
        r.studentId === input.studentId &&
        r.dayOfWeek === input.dayOfWeek &&
        r.startMinute === input.startMinute,
    );
    if (duplicate) throw new ScheduleConflictError();
    this.sequence += 1;
    const row: WeeklyScheduleEntry = {
      id: `schedule-${this.sequence}`,
      studentId: input.studentId,
      dayOfWeek: input.dayOfWeek,
      startMinute: input.startMinute,
      endMinute: input.endMinute,
      subject: input.subject,
      teacher: input.teacher ?? null,
      room: input.room ?? null,
      createdAt: new Date(2026, 10, 1),
      updatedAt: new Date(2026, 10, 1),
    };
    this.rows.set(row.id, row);
    this.writes += 1;
    return row;
  }

  async update(
    id: string,
    patch: ScheduleEntryPatch,
  ): Promise<WeeklyScheduleEntry> {
    this.maybeThrow();
    const row = this.rows.get(id);
    if (!row) throw new NotFoundError(".schedule entry");
    const next: WeeklyScheduleEntry = { ...row, ...patch, updatedAt: new Date() };
    this.rows.set(id, next);
    this.writes += 1;
    return next;
  }

  async delete(id: string): Promise<void> {
    this.maybeThrow();
    if (!this.rows.has(id)) throw new NotFoundError("schedule entry");
    this.rows.delete(id);
    this.writes += 1;
  }
}

export class FakeHomeworkRepository implements HomeworkRepositoryPort {
  private readonly rows = new Map<string, HomeworkItem>();
  private sequence = 0;
  writes = 0;
  private thrower: unknown = null;

  throwOnCall(next: unknown): void {
    this.thrower = next;
  }

  private maybeThrow(): void {
    if (this.thrower !== null) {
      const err = this.thrower;
      this.thrower = null;
      throw err;
    }
  }

  async listByStudent(
    studentId: string,
    filter: HomeworkFilter,
  ): Promise<HomeworkItem[]> {
    return [...this.rows.values()]
      .filter((r) => r.studentId === studentId)
      .filter((r) => {
        if (filter === "pending") return r.completedAt === null;
        if (filter === "done") return r.completedAt !== null;
        return true;
      })
      .sort(
        (a, b) =>
          (a.completedAt ?? new Date(8e15)).getTime() -
            (b.completedAt ?? new Date(8e15)).getTime() ||
          HOMEWORK_PRIORITY_RANK[b.priority] -
            HOMEWORK_PRIORITY_RANK[a.priority] ||
          a.deadline.getTime() - b.deadline.getTime(),
      );
  }

  async findById(id: string): Promise<HomeworkItem | null> {
    return this.rows.get(id) ?? null;
  }

  async create(input: NewHomework): Promise<HomeworkItem> {
    this.maybeThrow();
    this.sequence += 1;
    const row: HomeworkItem = {
      id: `homework-${this.sequence}`,
      studentId: input.studentId,
      title: input.title,
      subject: input.subject ?? null,
      priority: HOMEWORK_PRIORITY_LABEL[input.priority] ?? "low",
      deadline: input.deadline,
      completedAt: null,
      createdAt: new Date(2026, 10, 1),
      updatedAt: new Date(2026, 10, 1),
    };
    this.rows.set(row.id, row);
    this.writes += 1;
    return row;
  }

  async setCompletedAt(
    id: string,
    completedAt: Date | null,
  ): Promise<HomeworkItem> {
    this.maybeThrow();
    const row = this.rows.get(id);
    if (!row) throw new NotFoundError("homework");
    const next: HomeworkItem = { ...row, completedAt, updatedAt: new Date() };
    this.rows.set(id, next);
    this.writes += 1;
    return next;
  }

  async delete(id: string): Promise<void> {
    this.maybeThrow();
    if (!this.rows.has(id)) throw new NotFoundError("homework");
    this.rows.delete(id);
    this.writes += 1;
  }
}

/**
 * One in-memory table shared by both planning fakes, so a plan row is visible
 * to the budget guard and a budget row is visible to the plan guard.
 */
export interface PlanningStore {
  budgets: Map<string, FreeTimeBudget>;
  plans: HomeworkPlanEntry[];
}

export function createPlanningStore(): PlanningStore {
  return { budgets: new Map(), plans: [] };
}

function budgetKey(studentId: string, dayKey: string): string {
  return `${studentId}:${dayKey}`;
}

export class FakeFreeTimeBudgetRepository implements FreeTimeBudgetRepositoryPort {
  private sequence = 0;
  writes = 0;
  private thrower: unknown = null;

  constructor(private readonly store: PlanningStore = createPlanningStore()) {}

  throwOnCall(next: unknown): void {
    this.thrower = next;
  }

  private maybeThrow(): void {
    if (this.thrower !== null) {
      const err = this.thrower;
      this.thrower = null;
      throw err;
    }
  }

  /** Pre-loads a budget row without going through the guarded write path. */
  seed(studentId: string, dayKey: string, freeMinutes: number): FreeTimeBudget {
    this.sequence += 1;
    const row: FreeTimeBudget = {
      id: `budget-${this.sequence}`,
      studentId,
      dayKey,
      freeMinutes,
    };
    this.store.budgets.set(budgetKey(studentId, dayKey), row);
    return row;
  }

  private usedMinutes(studentId: string, dayKey: string): number {
    return this.store.plans
      .filter((r) => r.studentId === studentId && r.dayKey === dayKey)
      .reduce((sum, r) => sum + r.plannedMinutes, 0);
  }

  async findByDay(studentId: string, dayKey: string): Promise<FreeTimeBudget | null> {
    return this.store.budgets.get(budgetKey(studentId, dayKey)) ?? null;
  }

  async listInRange(
    studentId: string,
    fromKey: string,
    toKey: string,
  ): Promise<FreeTimeBudget[]> {
    return [...this.store.budgets.values()]
      .filter((r) => r.studentId === studentId && r.dayKey >= fromKey && r.dayKey <= toKey)
      .sort((a, b) => (a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0));
  }

  async upsertWithinUsed(input: {
    studentId: string;
    dayKey: string;
    freeMinutes: number;
    allows: (usedMinutes: number) => boolean;
  }): Promise<UpsertWithinUsedResult> {
    this.maybeThrow();
    const usedMinutes = this.usedMinutes(input.studentId, input.dayKey);
    if (!input.allows(usedMinutes)) return { ok: false, usedMinutes };
    const key = budgetKey(input.studentId, input.dayKey);
    const existing = this.store.budgets.get(key);
    const row: FreeTimeBudget = existing
      ? { ...existing, freeMinutes: input.freeMinutes }
      : this.seed(input.studentId, input.dayKey, input.freeMinutes);
    this.store.budgets.set(key, row);
    this.writes += 1;
    return { ok: true, budget: row };
  }
}

export class FakeHomeworkPlanRepository implements HomeworkPlanRepositoryPort {
  private sequence = 0;
  writes = 0;
  private thrower: unknown = null;

  constructor(private readonly store: PlanningStore = createPlanningStore()) {}

  throwOnCall(next: unknown): void {
    this.thrower = next;
  }

  private maybeThrow(): void {
    if (this.thrower !== null) {
      const err = this.thrower;
      this.thrower = null;
      throw err;
    }
  }

  /** Pre-loads a plan row without going through the capacity guard. */
  seed(
    studentId: string,
    dayKey: string,
    homeworkId: string,
    plannedMinutes: number,
  ): HomeworkPlanEntry {
    this.sequence += 1;
    const row: HomeworkPlanEntry = {
      id: `plan-${this.sequence}`,
      studentId,
      dayKey,
      homeworkId,
      plannedMinutes,
    };
    this.store.plans.push(row);
    return row;
  }

  async listByDay(studentId: string, dayKey: string): Promise<HomeworkPlanEntry[]> {
    return this.store.plans.filter((r) => r.studentId === studentId && r.dayKey === dayKey);
  }

  async listByStudentInRange(
    studentId: string,
    fromKey: string,
    toKey: string,
  ): Promise<HomeworkPlanEntry[]> {
    return this.store.plans
      .filter((r) => r.studentId === studentId && r.dayKey >= fromKey && r.dayKey <= toKey)
      .sort((a, b) => (a.dayKey < b.dayKey ? -1 : a.dayKey > b.dayKey ? 1 : 0));
  }

  async findByHomeworkAndDay(
    homeworkId: string,
    dayKey: string,
  ): Promise<HomeworkPlanEntry | null> {
    return (
      this.store.plans.find((r) => r.homeworkId === homeworkId && r.dayKey === dayKey) ?? null
    );
  }

  async upsertWithinCapacity(input: {
    studentId: string;
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
    allows: (current: { freeMinutes: number | null; usedMinutes: number }) => boolean;
  }): Promise<UpsertWithinCapacityResult> {
    this.maybeThrow();
    const budget = this.store.budgets.get(budgetKey(input.studentId, input.dayKey));
    if (!budget) return { ok: false, freeMinutes: null, usedMinutes: 0 };
    const usedMinutes = this.store.plans
      .filter(
        (r) =>
          r.studentId === input.studentId &&
          r.dayKey === input.dayKey &&
          r.homeworkId !== input.homeworkId,
      )
      .reduce((sum, r) => sum + r.plannedMinutes, 0);
    if (!input.allows({ freeMinutes: budget.freeMinutes, usedMinutes })) {
      return { ok: false, freeMinutes: budget.freeMinutes, usedMinutes };
    }
    const index = this.store.plans.findIndex(
      (r) => r.homeworkId === input.homeworkId && r.dayKey === input.dayKey,
    );
    const entry: HomeworkPlanEntry =
      index >= 0
        ? { ...this.store.plans[index], plannedMinutes: input.plannedMinutes }
        : this.seed(
            input.studentId,
            input.dayKey,
            input.homeworkId,
            input.plannedMinutes,
          );
    if (index >= 0) this.store.plans[index] = entry;
    this.writes += 1;
    return { ok: true, entry };
  }

  async delete(input: { id: string; studentId: string }): Promise<void> {
    this.maybeThrow();
    const index = this.store.plans.findIndex(
      (r) => r.id === input.id && r.studentId === input.studentId,
    );
    if (index < 0) throw new NotFoundError("plan");
    this.store.plans.splice(index, 1);
    this.writes += 1;
  }
}

/** Builds fakes keyed by studentId so use cases can be tested with ownership. */
export interface PlanningFakes {
  schedule: FakeScheduleRepository;
  homework: FakeHomeworkRepository;
  budget: FakeFreeTimeBudgetRepository;
  plans: FakeHomeworkPlanRepository;
}

export function createPlanningFakes(): PlanningFakes {
  const store = createPlanningStore();
  return {
    schedule: new FakeScheduleRepository(),
    homework: new FakeHomeworkRepository(),
    budget: new FakeFreeTimeBudgetRepository(store),
    plans: new FakeHomeworkPlanRepository(store),
  };
}
