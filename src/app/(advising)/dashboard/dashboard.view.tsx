import type { ReactNode } from "react";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import type { DashboardData } from "./dashboard.fixture";
import { HomeworkTodayView } from "./_components/homework-today.view";
import { StudyPlanView } from "./_components/study-plan.view";
import { FreeTimeCardView } from "./_components/free-time-card.view";
import { WeeklyGoalView } from "./_components/weekly-goal.view";
import { NutritionWidgetView } from "./_components/nutrition-widget.view";
import { TEST_IDS } from "@/constants/test-ids";

interface DashboardViewProps {
  data: DashboardData;
  demo: "success" | "empty" | "loading" | "error";
  tickedHomework: Map<string, number>;
  homeworkMinutes: Map<string, number>;
  tickedBlocks: Set<string>;
  eatenSlots: Set<string>;
  testsDone: number;
  studiedMinutes: number;
  onToggleHomework: (id: string) => void;
  onSetHomeworkMinutes: (id: string, minutes: number | null) => void;
  onToggleBlock: (block: StudyBlock) => void;
  onToggleMeal: (slot: string) => void;
  onAddTests: (delta: number) => void;
}

export function DashboardView(props: DashboardViewProps): ReactNode {
  const {
    data,
    demo,
    tickedHomework,
    homeworkMinutes,
    tickedBlocks,
    eatenSlots,
    testsDone,
    studiedMinutes,
    onToggleHomework,
    onSetHomeworkMinutes,
    onToggleBlock,
    onToggleMeal,
    onAddTests,
  } = props;

  if (demo === "error") {
    return (
      <section
        className="rounded-xl border border-red-200 bg-red-50 p-6"
        role="alert"
        data-testid={TEST_IDS.DASHBOARD.DEMO_ERROR}
      >
        <p className="text-sm text-red-700">خطا در بارگذاری داشبورد. دوباره امتحان کنید.</p>
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
        <h1 className="text-xl font-bold">{data.greetingName} عزیز، سلام</h1>
        <p className="mt-1 text-sm text-slate-500">
          امروز چه کار دارید؟ برنامه کلاس‌ها، تکالیف و وقت آزادتان در یک نگاه.
        </p>
      </section>

      {/* Card 1 — homework */}
      <HomeworkTodayView
        items={[...data.homework.today, ...data.homework.tomorrow]}
        tickedHomework={tickedHomework}
        homeworkMinutes={homeworkMinutes}
        onToggleHomework={onToggleHomework}
        onSetHomeworkMinutes={onSetHomeworkMinutes}
        demo={demo}
      />

      {/* Card 2 — study plan + free time + book */}
      <div className="grid gap-4 md:grid-cols-2">
        <StudyPlanView
          blocks={data.blocks}
          ticked={tickedBlocks}
          onToggle={onToggleBlock}
          book={data.book}
          demo={demo}
        />
        <FreeTimeCardView
          freeMinutes={data.freeMinutes}
          breakdown={data.freeTimeBreakdown}
          demo={demo}
        />
      </div>

      {/* Card 3 — weekly goal */}
      <WeeklyGoalView
        goal={data.goal}
        testsDone={testsDone}
        studiedMinutes={studiedMinutes}
        needLabel={data.needLabel}
        onAddTests={onAddTests}
        demo={demo}
      />

      {/* Calorie widget */}
      <NutritionWidgetView
        plan={data.meal.plan}
        eatenSlots={eatenSlots}
        targetCalories={data.meal.targetCalories}
        hasPhysicalProfile={data.meal.hasPhysicalProfile}
        onToggleMeal={onToggleMeal}
        demo={demo}
      />
    </div>
  );
}
