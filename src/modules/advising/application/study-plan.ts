/**
 * Study plan use cases (counselor-owned weekly program).
 *
 * Reads compose profile, school program, schedule and goal data. Writes are
 * gated by `assertCounselorOfStudent` — only a student's own counselor may
 * write their plan.
 */

import { ForbiddenError, NotFoundError, ValidationError } from "@/modules/advising/domain/errors";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import {
  assertCounselorOfStudent,
  type Actor,
} from "@/modules/advising/application/planning-access";
import { goalProgress, type GoalTargets } from "@/modules/advising/domain/weekly-goal";
import {
  loggedMinutesByEntry,
  planMinutesTotal,
  studiedMinutesBySubject,
} from "@/modules/advising/domain/study-plan";
import { chapterIdsAreValid, dedupeChapterIds } from "@/modules/advising/domain/chapters";
import type {
  SchoolProgramEntry,
  StudyPlan,
  StudyPlanEntry,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import type {
  ChapterRepositoryPort,
  SchoolProgramRepositoryPort,
  ScheduleRepositoryPort,
  StudyPlanRepositoryPort,
  UserRepositoryPort,
  WeeklyGoalRepositoryPort,
} from "@/modules/advising/domain/ports";
import { resolveWeekKey } from "@/modules/advising/application/weekly-goal";

const ENTRY_MINUTES_MIN = 15;
const ENTRY_MINUTES_MAX = 720;
const NOTE_MAX = 200;
const CHAPTERS_MAX_PER_ENTRY = 10;

export type StudentStudyPlanView = {
  plan: StudyPlan | null;
  weekKey: string;
  entries: StudyPlanEntry[];
  schoolProgram: SchoolProgramEntry[];
  weeklySchedule: WeeklyScheduleEntry[];
  goalProgress: ReturnType<typeof goalProgress>;
  loggedMinutesByEntry: Record<string, number>;
  testsBySubject: Record<string, number>;
  rows: StudyPlanSubjectRow[];
  totals: StudyPlanTotals;
  student: {
    fullName: string;
    grade: string | null;
    fieldOfStudy: string | null;
  };
  /** True for the counselor of record; false for the read-only supervisor. */
  canWrite: boolean;
};

export type StudyPlanSubjectRow = {
  subject: string;
  plannedMinutes: number;
  studiedMinutes: number;
  shortfallMinutes: number;
  testsDone: number;
  testsTarget: number;
};

export type StudyPlanTotals = {
  plannedMinutes: number;
  studiedMinutes: number;
  shortfallMinutes: number;
  testsDone: number;
  testsTarget: number;
};

export class GetStudentStudyPlanUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
    private readonly schoolProgram: SchoolProgramRepositoryPort,
    private readonly schedule: ScheduleRepositoryPort,
    private readonly goals: WeeklyGoalRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    studentId: string;
    weekKey?: string;
  }): Promise<StudentStudyPlanView> {
    const owner = await this.users.findById(input.studentId);
    if (!owner || owner.role !== "student") throw new ForbiddenError();

    const canWrite =
      hasCapability(input.actor.role, "plan:write") &&
      owner.counselorId === input.actor.id;
    const canSupervise = hasCapability(input.actor.role, "supervise:read");
    // A student reads their own program (read-only); they execute it, never edit.
    const canReadSelf =
      input.actor.role === "student" && input.actor.id === input.studentId;
    if (!canWrite && !canSupervise && !canReadSelf) throw new ForbiddenError();

    const weekKey = resolveWeekKey(input.weekKey);
    const [plan, school, schedule, goal, subjectTests] = await Promise.all([
      this.plans.findForStudent(input.studentId),
      this.schoolProgram.listByStudent(input.studentId),
      this.schedule.listByStudent(input.studentId),
      this.goals.findByKey(input.studentId, weekKey),
      this.goals.listSubjectTests({ studentId: input.studentId, weekKey }),
    ]);

    const entries = plan?.entries ?? [];
    const targets: GoalTargets = plan
      ? { studyMinutesTarget: planMinutesTotal(entries), testsTarget: plan.testsTarget }
      : { studyMinutesTarget: 0, testsTarget: 0 };

    // One source of truth: the student's ticks are plan-entry keys, so studied
    // minutes per subject come from the same rows the counselor authored.
    const studiedBySubject = studiedMinutesBySubject(
      goal?.completedBlocks ?? [],
      entries,
    );
    const loggedByEntry = loggedMinutesByEntry(
      goal?.completedBlocks ?? [],
      entries,
    );
    const studiedMinutes = Object.values(studiedBySubject).reduce(
      (sum, minutes) => sum + minutes,
      0,
    );
    const progress = goalProgress(goal, targets, studiedMinutes);
    const testsBySubject = Object.fromEntries(
      subjectTests.map((t) => [t.subject, t.count]),
    );

    const plannedBySubject: Record<string, number> = {};
    for (const entry of entries) {
      plannedBySubject[entry.subject] =
        (plannedBySubject[entry.subject] ?? 0) + entry.minutes;
    }

    const testsTargetBySubject: Record<string, number> = {};
    for (const entry of entries) {
      testsTargetBySubject[entry.subject] =
        (testsTargetBySubject[entry.subject] ?? 0) + entry.testsTarget;
    }
    const rows: StudyPlanSubjectRow[] = Object.keys(plannedBySubject).map((subject) => {
      const plannedMinutes = plannedBySubject[subject];
      const studiedMinutes = studiedBySubject[subject] ?? 0;
      return {
        subject,
        plannedMinutes,
        studiedMinutes,
        shortfallMinutes: Math.max(0, plannedMinutes - studiedMinutes),
        testsDone: testsBySubject[subject] ?? 0,
        testsTarget: testsTargetBySubject[subject] ?? 0,
      };
    });

    const totals: StudyPlanTotals = {
      plannedMinutes: rows.reduce((sum, r) => sum + r.plannedMinutes, 0),
      studiedMinutes: progress.studyMinutes,
      shortfallMinutes: 0,
      testsDone: progress.testsDone,
      testsTarget: plan?.testsTarget ?? 0,
    };
    totals.shortfallMinutes = Math.max(0, totals.plannedMinutes - totals.studiedMinutes);

    return {
      plan,
      weekKey,
      entries,
      schoolProgram: school,
      weeklySchedule: schedule,
      goalProgress: progress,
      loggedMinutesByEntry: loggedByEntry,
      testsBySubject,
      rows,
      totals,
      student: {
        fullName: owner.fullName,
        grade: owner.grade,
        fieldOfStudy: owner.fieldOfStudy,
      },
      canWrite,
    };
  }
}

export type SaveStudyPlanHeaderInput = {
  actor: Actor;
  studentId: string;
  testsTarget: number;
};

export class SaveStudyPlanHeaderUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
  ) {}

  async execute(input: SaveStudyPlanHeaderInput): Promise<StudyPlan> {
    const ownerId = input.studentId;
    await assertCounselorOfStudent(this.users, input.actor, ownerId);

    if (input.testsTarget < 0 || input.testsTarget > 2000) {
      throw new ValidationError("تعداد تست باید بین ۰ تا ۲۰۰۰ باشد");
    }

    return this.plans.upsertHeader({
      studentId: ownerId,
      counselorId: input.actor.id,
      testsTarget: input.testsTarget,
    });
  }
}

export type AddStudyPlanEntryInput = {
  actor: Actor;
  studentId: string;
  dayOfWeek: number;
  subject: string;
  minutes: number;
  testsTarget?: number;
  chapterIds?: string[];
  note?: string | null;
};

export class AddStudyPlanEntryUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
    private readonly chapters: ChapterRepositoryPort,
  ) {}

  async execute(input: AddStudyPlanEntryInput): Promise<StudyPlanEntry> {
    const ownerId = input.studentId;
    await assertCounselorOfStudent(this.users, input.actor, ownerId);

    const user = await this.users.findById(ownerId);
    if (!user) throw new NotFoundError("user");

    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      throw new ValidationError("روز هفته نامعتبر است");
    }
    const minutes = Math.round(input.minutes);
    if (minutes < ENTRY_MINUTES_MIN || minutes > ENTRY_MINUTES_MAX) {
      throw new ValidationError("ساعت‌ها باید بین ۰٫۲۵ تا ۱۲ باشد");
    }
    if (input.note !== null && input.note !== undefined) {
      const trimmed = input.note.trim();
      if (trimmed.length > NOTE_MAX) {
        throw new ValidationError("note");
      }
    }

    const chapterIds = dedupeChapterIds(input.chapterIds ?? []);
    if (chapterIds.length > CHAPTERS_MAX_PER_ENTRY) {
      throw new ValidationError("chapters");
    }

    const catalog = await this.chapters.findByIds(chapterIds);
    const target = {
      subject: input.subject,
      grade: user.grade,
      field: user.fieldOfStudy,
    };
    if (!chapterIdsAreValid(chapterIds, catalog, target)) {
      throw new ValidationError("chapters");
    }

    const note = input.note ? input.note.trim() || null : null;

    const testsTarget = input.testsTarget ?? 0;
    if (testsTarget < 0 || testsTarget > 2000) {
      throw new ValidationError("تعداد تست هدف باید بین ۰ تا ۲۰۰۰ باشد");
    }

    const plan = await this.plans.findForStudent(ownerId);
    if (plan) {
      const current = plan.entries.reduce((sum, e) => sum + e.testsTarget, 0);
      if (current + testsTarget > plan.testsTarget) {
        throw new ValidationError("جمع هدف تست به تفکیک درس از هدف کل هفته بیشتر است");
      }
    }

    return this.plans.upsertEntry({
      studentId: ownerId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes,
      testsTarget,
      chapterIds,
      note,
    });
  }
}

export type DeleteStudyPlanEntryInput = {
  actor: Actor;
  studentId: string;
  entryId: string;
};

export class DeleteStudyPlanEntryUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
  ) {}

  async execute(input: DeleteStudyPlanEntryInput): Promise<void> {
    const ownerId = input.studentId;
    await assertCounselorOfStudent(this.users, input.actor, ownerId);
    await this.plans.deleteEntry({ studentId: ownerId, entryId: input.entryId });
  }
}
