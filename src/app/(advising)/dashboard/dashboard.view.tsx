import type { ReactNode } from "react";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import type { DashboardReadModel } from "@/modules/advising/application/dashboard";

import { HomeworkTodayView } from "./_components/homework-today.view";
import { StudyPlanView } from "./_components/study-plan.view";
import { FreeTimeCardView } from "./_components/free-time-card.view";
import { WeeklyGoalView } from "./_components/weekly-goal.view";
import { NutritionWidgetView } from "./_components/nutrition-widget.view";
import { TEST_IDS } from "@/constants/test-ids";

interface DashboardViewProps {
  overview: DashboardReadModel;
  studiedMinutes: number;
  homeworkMinutes: Map<string, number>;
  testsDone: number;
  onSetHomeworkMinutes: (id: string, minutes: number | null) => void;
  onToggleHomework: (id: string) => void;
  onSaveBlockMinutes: (block: StudyBlock, minutes: number) => void;
  onToggleMeal: (slot: string) => void;
  onSaveTests: (subject: string, count: number) => void;
  error: string | null;
  labels: Record<string, string>;
}

export function DashboardView(props: DashboardViewProps): ReactNode {
  const {
    overview,
    studiedMinutes,
    homeworkMinutes,
    testsDone,
    onSetHomeworkMinutes,
    onToggleHomework,
    onSaveBlockMinutes,
    onToggleMeal,
    onSaveTests,
    error,
    labels,
  } = props;

  if (error) {
    return (
      <section
        className="rounded-xl border border-red-200 bg-red-50 p-6"
        role="alert"
        data-testid={TEST_IDS.DASHBOARD.ACTION_ERROR}
      >
        <p className="text-sm text-red-700">{error}</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Hero — the one bold element: brand green greeting card */}
      <section
        className="rounded-2xl bg-teal-600 px-6 py-7 text-white"
        data-testid={TEST_IDS.DASHBOARD.CARD("greeting")}
      >
        <h1 className="text-2xl font-bold text-balance">
          سلام {overview.profile.fullName.split(" ")[0]}!
        </h1>
        <p className="mt-2 text-sm text-teal-50">
          امروز چه کار داری؟ تکالیف، برنامه مطالعه و وقت آزادت همین‌جاست.
        </p>
      </section>

      {/* Card 1 — homework */}
      <HomeworkTodayView
        labels={labels}
        items={[...overview.homework.today, ...overview.homework.tomorrow]}
        homeworkMinutes={homeworkMinutes}
        onSetHomeworkMinutes={onSetHomeworkMinutes}
        onToggleHomework={onToggleHomework}
      />

      {/* Card 2 — study plan + free time + book */}
      <div className="grid gap-4 md:grid-cols-2">
        <StudyPlanView
          labels={labels}
          blocks={overview.blocks}
          onSaveMinutes={onSaveBlockMinutes}
          book={overview.book}
        />
        <FreeTimeCardView
          freeMinutes={overview.freeMinutes}
          breakdown={overview.freeTimeBreakdown}
        />
      </div>

      {/* Card 3 — weekly goal */}
      <WeeklyGoalView
        goal={overview.goal}
        testsDone={testsDone}
        studiedMinutes={studiedMinutes}
        labels={labels}
        needLabel={overview.needLabel}
        onSaveTests={onSaveTests}
      />

      {/* Calorie widget */}
      <NutritionWidgetView
        plan={overview.meal.plan}
        eatenSlots={new Set(overview.meal.plan?.eatenSlots ?? [])}
        targetCalories={overview.meal.targetCalories}
        hasPhysicalProfile={overview.meal.hasPhysicalProfile}
        onToggleMeal={onToggleMeal}
      />
    </div>
  );
}
