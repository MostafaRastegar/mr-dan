/**
 * Dashboard read model for the student home page.
 *
 * Every value below comes from the database through the existing use cases and
 * pure domain helpers — nothing here is hard-coded. The page itself is server
 * rendered, so there is no client fetch and no loading state.
 */

import { type Actor } from "@/modules/advising/application/planning-access";
import { NotFoundError } from "@/modules/advising/domain/errors";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import {
  computeEnergy,
  isPhysicalProfileComplete,
} from "@/modules/advising/domain/energy";
import {
  freeMinutesForDay,
  otherOccupiedMinutesForDay,
  wakingMinutes,
} from "@/modules/advising/domain/free-time";
import { goalProgress, type GoalTargets } from "@/modules/advising/domain/weekly-goal";
import {
  iranDayKey,
  persianDayOf,
  shiftDayKey,
  weekStartKey,
} from "@/modules/advising/domain/day-key";
import { pickBookFrom } from "@/modules/advising/domain/catalog";
import { suggestLeisure, type LeisureInputs } from "@/modules/advising/domain/leisure";
import {
  loggedMinutesByEntry,
  planMinutesTotal,
  studiedMinutesBySubject,
} from "@/modules/advising/domain/study-plan";
import type {
  HomeworkItem,
  MealPlanRecord,
  Role,
} from "@/modules/advising/domain/models";
import type {
  CatalogRepositoryPort,
  FreeTimeBudgetRepositoryPort,
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
  MealPlanRepositoryPort,
  SchoolProgramRepositoryPort,
  StudyPlanRepositoryPort,
  UserRepositoryPort,
  WeeklyGoalRepositoryPort,
} from "@/modules/advising/domain/ports";

export interface DashboardGoal {
  studiedMinutes: number;
  studyMinutesTarget: number;
  testsTarget: number;
  testsDone: number;
  completedBlocks: string[];
  testsBySubject: Record<string, number>;
  /** Subjects the counselor actually scheduled this week (test logging scope). */
  subjects: string[];
  testsTargetBySubject: Record<string, number>;
}

export interface DashboardMeal {
  plan: MealPlanRecord | null;
  targetCalories: number | null;
  hasPhysicalProfile: boolean;
}

export interface DashboardProfile {
  fullName: string;
  role: Role;
}

export interface DashboardReadModel {
  greetingName: string;
  todayKey: string;
  homework: { today: HomeworkItem[]; tomorrow: HomeworkItem[] };
  blocks: StudyBlock[];
  freeMinutes: number;
  freeTimeBreakdown: {
    wakingMinutes: number;
    schoolMinutes: number;
    otherOccupiedMinutes: number;
    homeworkAverageMinutes: number;
  };
  book: string | null;
  needLabel: string;
  goal: DashboardGoal | null;
  meal: DashboardMeal;
  profile: DashboardProfile;
}

function homeworkDayKey(item: HomeworkItem): string {
  return iranDayKey(item.deadline);
}

function needLabelOf(
  hasPlan: boolean,
  progress: ReturnType<typeof goalProgress>,
): string {
  if (!hasPlan) return "برنامهٔ مشاور ثبت نشده است";
  const remaining = progress.studyMinutesTarget - progress.studyMinutes;
  if (remaining > 0) {
    return `نیاز به ${remaining} دقیقه مطالعه بیشتر برای رسیدن به هدف هفته`;
  }
  return "هدف هفته به دست آمد";
}

export class GetDashboardOverviewUseCase {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly homework: HomeworkRepositoryPort,
    private readonly schoolProgram: SchoolProgramRepositoryPort,
    private readonly goals: WeeklyGoalRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
    private readonly budgets: FreeTimeBudgetRepositoryPort,
    private readonly homeworkPlans: HomeworkPlanRepositoryPort,
    private readonly mealPlans: MealPlanRepositoryPort,
    private readonly catalogs: CatalogRepositoryPort,
  ) {}

  async execute(input: {
    actor: Actor;
    now?: Date;
  }): Promise<DashboardReadModel> {
    const user = await this.users.findById(input.actor.id);
    if (!user) throw new NotFoundError("user");

    const profile = await this.users.findPhysicalProfile(input.actor.id);
    const now = input.now ?? new Date();
    const todayKey = iranDayKey(now);
    const tomorrowKey = shiftDayKey(todayKey, 1);
    const dayOfWeek = persianDayOf(todayKey);

    const allHomework = await this.homework.listByStudent(input.actor.id, "all");
    const homework = {
      today: allHomework.filter((item) => homeworkDayKey(item) === todayKey),
      tomorrow: allHomework.filter(
        (item) => homeworkDayKey(item) === tomorrowKey,
      ),
    };

    const weekKey = weekStartKey(todayKey);
    const [schoolRows, goalRow, plan, subjectTests] = await Promise.all([
      this.schoolProgram.listByStudent(input.actor.id),
      this.goals.findByKey(input.actor.id, weekKey),
      this.plans.findForStudent(input.actor.id),
      this.goals.listSubjectTests({ studentId: input.actor.id, weekKey }),
    ]);
    const entries = plan?.entries ?? [];
    const loggedByEntry = loggedMinutesByEntry(
      goalRow?.completedBlocks ?? [],
      entries,
    );
    const blocks: StudyBlock[] = entries
      .filter((entry) => entry.dayOfWeek === dayOfWeek)
      .map((entry) => ({
        dayKey: todayKey,
        startMinute: 0,
        minutes: entry.minutes,
        subject: entry.subject,
        entryId: entry.id,
        loggedMinutes: loggedByEntry[entry.id] ?? 0,
        testsTarget: entry.testsTarget,
      }));

    const schoolMinutes = schoolRows
      .filter((entry) => entry.dayOfWeek === dayOfWeek)
      .reduce((sum, entry) => sum + entry.minutes, 0);
    const otherOccupied = otherOccupiedMinutesForDay(
      user.otherOccupiedMinutes ?? [],
      dayOfWeek,
    );
    const homeworkAverage = user.homeworkAverageMinutes ?? 0;
    const freeMinutes = freeMinutesForDay({
      wakeMinutes: user.wakeMinutes,
      sleepMinutes: user.sleepMinutes,
      schoolMinutes,
      otherOccupiedMinutes: otherOccupied,
      homeworkAverageMinutes: homeworkAverage,
    });

    const targets: GoalTargets = plan
      ? {
          studyMinutesTarget: planMinutesTotal(entries),
          testsTarget: plan.testsTarget,
        }
      : { studyMinutesTarget: 0, testsTarget: 0 };
    const studiedBySubject = studiedMinutesBySubject(
      goalRow?.completedBlocks ?? [],
      entries,
    );
    const studiedMinutes = Object.values(studiedBySubject).reduce(
      (sum, minutes) => sum + minutes,
      0,
    );
    const progress = goalProgress(goalRow, targets, studiedMinutes);
    const goal: DashboardGoal | null = {
      studiedMinutes: progress.studyMinutes,
      studyMinutesTarget: progress.studyMinutesTarget,
      testsTarget: progress.testsTarget,
      testsDone: progress.testsDone,
      completedBlocks: goalRow?.completedBlocks ?? [],
      testsBySubject: Object.fromEntries(
        subjectTests.map((row) => [row.subject, row.count]),
      ),
      subjects: [...new Set(entries.map((entry) => entry.subject))],
      testsTargetBySubject: entries.reduce<Record<string, number>>(
        (sum, entry) => ({
          ...sum,
          [entry.subject]: (sum[entry.subject] ?? 0) + entry.testsTarget,
        }),
        {},
      ),
    };

    const fromKey = shiftDayKey(todayKey, -6);
    const [budgetRows, planRows] = await Promise.all([
      this.budgets.listInRange(input.actor.id, fromKey, todayKey),
      this.homeworkPlans.listByStudentInRange(input.actor.id, fromKey, todayKey),
    ]);
    const pending = await this.homework.listByStudent(input.actor.id, "pending");
    const overdueHomework = pending.filter(
      (item) => iranDayKey(item.deadline) < todayKey,
    ).length;
    const leisureInputs: LeisureInputs = {
      plannedMinutes7d: planRows.reduce((sum, row) => sum + row.plannedMinutes, 0),
      freeMinutes7d: budgetRows.reduce((sum, row) => sum + row.freeMinutes, 0),
      pendingHomework: pending.length,
      overdueHomework,
    };
    const suggestion = suggestLeisure(leisureInputs);
    const book = pickBookFrom(await this.catalogs.listBooks(), {
      field: user.fieldOfStudy,
      code: suggestion.code,
    });

    const mealPlan = await this.mealPlans.findByDay(input.actor.id, todayKey);
    const complete = profile != null && isPhysicalProfileComplete(profile);
    const meal: DashboardMeal = {
      plan: mealPlan,
      targetCalories: complete ? computeEnergy(profile!).targetCalories : null,
      hasPhysicalProfile: complete,
    };

    return {
      greetingName: user.fullName,
      todayKey,
      homework,
      blocks,
      freeMinutes,
      freeTimeBreakdown: {
        wakingMinutes: wakingMinutes({
          wakeMinutes: user.wakeMinutes,
          sleepMinutes: user.sleepMinutes,
        }),
        schoolMinutes,
        otherOccupiedMinutes: otherOccupied,
        homeworkAverageMinutes: homeworkAverage,
      },
      book: book?.title ?? null,
      needLabel: needLabelOf(!!plan, progress),
      goal,
      meal,
      profile: { fullName: user.fullName, role: user.role },
    };
  }
}
