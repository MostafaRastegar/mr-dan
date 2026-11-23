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
  HomeworkFilter,
  HomeworkItem,
  NewHomework,
  NewScheduleEntry,
  NewStudySession,
  ScheduleEntryPatch,
  StudySessionRecord,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import { HOMEWORK_PRIORITY_LABEL, HOMEWORK_PRIORITY_RANK } from "@/modules/advising/domain/models";
import type {
  HomeworkRepositoryPort,
  ScheduleRepositoryPort,
  StudySessionRepositoryPort,
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

export class FakeStudySessionRepository implements StudySessionRepositoryPort {
  private readonly rows: StudySessionRecord[] = [];
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

  async create(input: NewStudySession): Promise<StudySessionRecord> {
    this.maybeThrow();
    this.sequence += 1;
    const row: StudySessionRecord = {
      id: `study-${this.sequence}`,
      studentId: input.studentId,
      category: input.category,
      subject: input.subject ?? null,
      durationMinutes: input.durationMinutes,
      focusLevel: input.focusLevel ?? null,
      startedAt: input.startedAt,
      createdAt: new Date(2026, 10, 1),
    };
    this.rows.push(row);
    this.writes += 1;
    return row;
  }

  async listByStudentInRange(
    studentId: string,
    from: Date,
    to: Date,
  ): Promise<StudySessionRecord[]> {
    return this.rows
      .filter(
        (r) =>
          r.studentId === studentId &&
          r.startedAt.getTime() >= from.getTime() &&
          r.startedAt.getTime() < to.getTime(),
      )
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  }
}

/** Builds fakes keyed by studentId so use cases can be tested with ownership. */
export interface PlanningFakes {
  schedule: FakeScheduleRepository;
  homework: FakeHomeworkRepository;
  study: FakeStudySessionRepository;
}

export function createPlanningFakes(): PlanningFakes {
  return {
    schedule: new FakeScheduleRepository(),
    homework: new FakeHomeworkRepository(),
    study: new FakeStudySessionRepository(),
  };
}
