import type { ReactNode } from "react";
import { Button, Progress } from "antd";
import { IconTargetArrow } from "@tabler/icons-react";
import type { DashboardGoal } from "@/modules/advising/application/dashboard";
import { formatNumber } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface WeeklyGoalViewProps {
  goal: DashboardGoal | null;
  testsDone: number;
  studiedMinutes: number;
  needLabel: string;
  onAddTests: (delta: number) => void;
}

function percentOf(value: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export function WeeklyGoalView(props: WeeklyGoalViewProps): ReactNode {
  const { goal, testsDone, studiedMinutes, needLabel, onAddTests } = props;

  const studyPercent = goal ? percentOf(studiedMinutes, goal.studyMinutesTarget) : 0;
  const testsPercent = goal ? percentOf(testsDone, goal.testsTarget) : 0;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("goal")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700" aria-hidden="true">
          <IconTargetArrow size={18} stroke={1.8} />
        </span>
        <h2 className="text-lg font-semibold">هدف هفته</h2>
      </div>

      {!goal ? (
        <p className="mb-4 text-sm text-slate-500">{needLabel}</p>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">ساعت مطالعه</span>
              <span className="text-slate-900">
                {formatNumber(studiedMinutes)} / {formatNumber(goal.studyMinutesTarget)} دقیقه
              </span>
            </div>
            <Progress
              percent={studyPercent}
              data-testid={TEST_IDS.DASHBOARD.GOAL_STUDY_BAR}
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">تست‌ها</span>
              <span className="text-slate-900">
                {formatNumber(testsDone)} / {formatNumber(goal.testsTarget)}
              </span>
            </div>
            <Progress
              percent={testsPercent}
              data-testid={TEST_IDS.DASHBOARD.GOAL_TESTS_BAR}
            />
          </div>

          <p className="mb-4 text-xs text-slate-500">{needLabel}</p>

          <Button
            onClick={() => onAddTests(10)}
            className="w-full"
            data-testid={TEST_IDS.DASHBOARD.GOAL_ADD_TESTS}
          >
            +۱۰ تست
          </Button>
        </>
      )}
    </section>
  );
}
