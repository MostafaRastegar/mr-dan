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
  onToggleBlock: (block: StudyBlock) => void;
  onToggleMeal: (slot: string) => void;
  onAddTests: (delta: number) => void;
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
    onToggleBlock,
    onToggleMeal,
    onAddTests,
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
      {/* Card 0 — greeting */}
      <section
        className="rounded-xl border border-slate-200 bg-white p-6"
        data-testid={TEST_IDS.DASHBOARD.CARD("greeting")}
      >
        <h1 className="text-xl font-bold">{overview.profile.fullName} عزیز، سلام</h1>
        <p className="mt-1 text-sm text-slate-500">
          امروز چه کار دارید؟ برنامه کلاس‌ها، تکالیف و وقت آزادتان در یک نگاه.
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
          ticked={new Set(overview.goal?.completedBlocks ?? [])}
          onToggle={onToggleBlock}
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
        needLabel={overview.needLabel}
        onAddTests={onAddTests}
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
