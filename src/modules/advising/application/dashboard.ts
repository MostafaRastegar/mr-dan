/**
 * Dashboard read model for the student home page.
 *
 * Every value below comes from the database through the existing use cases and
 * pure domain helpers — nothing here is hard-coded. The page itself is server
 * rendered, so there is no client fetch and no loading state.
 */

import { type Actor } from "@/modules/advising/application/planning-access";
import { NotFoundError } from "@/modules/advising/domain/errors";
import { FIELDS } from "@/modules/advising/domain/models";
import {
  buildStudyBlocks,
  type StudyBlock,
} from "@/modules/advising/domain/study-blocks";
import {
  computeEnergy,
  isPhysicalProfileComplete,
} from "@/modules/advising/domain/energy";
import {
  classMinutesForDay,
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
import { pickBook } from "@/modules/advising/domain/books";
import { suggestLeisure, type LeisureInputs } from "@/modules/advising/domain/leisure";
import { planMinutesTotal } from "@/modules/advising/domain/study-plan";
import type {
  FieldOfStudy,
  HomeworkItem,
  MealPlanRecord,
  Role,
  WeeklyScheduleEntry,
} from "@/modules/advising/domain/models";
import type {
  FreeTimeBudgetRepositoryPort,
  HomeworkPlanRepositoryPort,
  HomeworkRepositoryPort,
  MealPlanRepositoryPort,
  ScheduleRepositoryPort,
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
  schedule: WeeklyScheduleEntry[];
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

function isKnownField(value: string | null | undefined): value is FieldOfStudy {
  return FIELDS.some((field) => field === value);
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
    private readonly schedule: ScheduleRepositoryPort,
    private readonly goals: WeeklyGoalRepositoryPort,
    private readonly plans: StudyPlanRepositoryPort,
    private readonly budgets: FreeTimeBudgetRepositoryPort,
    private readonly homeworkPlans: HomeworkPlanRepositoryPort,
    private readonly mealPlans: MealPlanRepositoryPort,
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

    const schedule = (await this.schedule.listByStudent(input.actor.id)).filter(
      (entry) => entry.dayOfWeek === dayOfWeek,
    );
    const blocks = schedule.flatMap((entry) =>
      buildStudyBlocks({
        dayKey: todayKey,
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
        subject: entry.subject,
      }),
    );

    const todaySchedule = schedule;
    const schoolMinutes = classMinutesForDay(todaySchedule, dayOfWeek);
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

    const weekKey = weekStartKey(todayKey);
    const [goalRow, plan] = await Promise.all([
      this.goals.findByKey(input.actor.id, weekKey),
      this.plans.findForStudent(input.actor.id),
    ]);
    const targets: GoalTargets = plan
      ? {
          studyMinutesTarget: planMinutesTotal(plan.entries ?? []),
          testsTarget: plan.testsTarget,
        }
      : { studyMinutesTarget: 0, testsTarget: 0 };
    const progress = goalProgress(goalRow, targets);
    const goal: DashboardGoal | null = {
      studiedMinutes: progress.studyMinutes,
      studyMinutesTarget: progress.studyMinutesTarget,
      testsTarget: progress.testsTarget,
      testsDone: progress.testsDone,
      completedBlocks: goalRow?.completedBlocks ?? [],
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
    const book = pickBook({
      field: isKnownField(user.fieldOfStudy) ? user.fieldOfStudy : null,
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
      schedule,
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
      book: book.title,
      needLabel: needLabelOf(!!plan, progress),
      goal,
      meal,
      profile: { fullName: user.fullName, role: user.role },
    };
  }
}
