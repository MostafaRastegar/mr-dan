/**
 * Study plan use cases (counselor-owned weekly program).
 *
 * Reads compose profile, school program, schedule and goal data. Writes are
 * gated by `assertCounselorOfStudent` — only a student's own counselor may
 * write their plan.
 */

import { NotFoundError, ValidationError } from "@/modules/advising/domain/errors";
import {
  assertCounselorOfStudent,
  type Actor,
} from "@/modules/advising/application/planning-access";
import { goalProgress, type GoalTargets, subjectStudiedMinutes } from "@/modules/advising/domain/weekly-goal";
import { planMinutesTotal } from "@/modules/advising/domain/study-plan";
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
import { currentWeekKey } from "@/modules/advising/application/weekly-goal";

const ENTRY_MINUTES_MIN = 15;
const ENTRY_MINUTES_MAX = 720;
const NOTE_MAX = 200;
const CHAPTERS_MAX_PER_ENTRY = 10;

export type StudentStudyPlanView = {
  plan: StudyPlan | null;
  entries: StudyPlanEntry[];
  schoolProgram: SchoolProgramEntry[];
  weeklySchedule: WeeklyScheduleEntry[];
  goalProgress: ReturnType<typeof goalProgress>;
  rows: StudyPlanSubjectRow[];
  totals: StudyPlanTotals;
};

export type StudyPlanSubjectRow = {
  subject: string;
  plannedMinutes: number;
  studiedMinutes: number;
  shortfallMinutes: number;
  testsDone: number;
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
    await assertCounselorOfStudent(this.users, input.actor, input.studentId);

    const weekKey = input.weekKey ?? currentWeekKey();
    const [plan, school, schedule, goal, subjectTests] = await Promise.all([
      this.plans.findForStudent(input.studentId),
      this.schoolProgram.listByStudent(input.studentId),
      this.schedule.listByStudent(input.studentId),
      this.goals.findByKey(input.studentId, weekKey),
      this.goals.listSubjectTests({ studentId: input.studentId, weekKey }),
    ]);

    const targets: GoalTargets = plan
      ? { studyMinutesTarget: planMinutesTotal(plan.entries ?? []), testsTarget: plan.testsTarget }
      : { studyMinutesTarget: 0, testsTarget: 0 };

    const progress = goalProgress(goal, targets);
    const studiedBySubject = subjectStudiedMinutes(goal?.completedBlocks ?? [], schedule);
    const testsBySubject = Object.fromEntries(subjectTests.map((t) => [t.subject, t.count]));

    const plannedBySubject: Record<string, number> = {};
    for (const entry of plan?.entries ?? []) {
      plannedBySubject[entry.subject] = (plannedBySubject[entry.subject] ?? 0) + entry.minutes;
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
      entries: plan?.entries ?? [],
      schoolProgram: school,
      weeklySchedule: schedule,
      goalProgress: progress,
      rows,
      totals,
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

    return this.plans.upsertEntry({
      studentId: ownerId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes,
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
