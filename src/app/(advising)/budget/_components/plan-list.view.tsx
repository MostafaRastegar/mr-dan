import type { ReactNode } from "react";
import { Button } from "antd";

import type { DayPlan } from "@/modules/advising/application/free-time";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import type { ActionState } from "@/utils/app-error";
import { TEST_IDS } from "@/constants/test-ids";

type DeletePlan = (
  previous: ActionState<{ deleted: true }> | null,
  formData: FormData,
) => Promise<ActionState<{ deleted: true }>>;

interface PlanListViewProps {
  plans: DayPlan[];
  canWrite: boolean;
  deletePlan: DeletePlan;
}

export function PlanListView(props: PlanListViewProps): ReactNode {
  const { plans, canWrite, deletePlan } = props;

  if (plans.length === 0) {
    return (
      <p
        className="text-sm text-slate-500"
        data-testid={TEST_IDS.BUDGET.EMPTY}
      >
        هنوز برنامه‌ای برای این روز ثبت نشده است.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" data-testid={TEST_IDS.BUDGET.PLAN_LIST}>
      {plans.map((plan) => (
        <li
          key={plan.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2"
          data-testid={TEST_IDS.BUDGET.PLAN_ROW}
        >
          <span className="font-medium">{plan.title}</span>
          <span className="text-sm text-slate-600">
            {formatClock(plan.plannedMinutes)}
          </span>
          {canWrite ? (
            <form
              action={(formData) => {
                void deletePlan(null, formData);
              }}
            >
              <input type="hidden" name="id" value={plan.id} />
              <Button size="small" danger htmlType="submit">
                حذف
              </Button>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
