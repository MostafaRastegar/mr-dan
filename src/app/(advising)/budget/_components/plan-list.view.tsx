import type { ReactNode } from "react";
import { Button, Popconfirm } from "antd";

import type { DayPlan } from "@/modules/advising/application/free-time";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface PlanListViewProps {
  plans: DayPlan[];
  canWrite: boolean;
  pending: boolean;
  formError: string | null;
  onDelete: (id: string) => void;
}

export function PlanListView(props: PlanListViewProps): ReactNode {
  const { plans, canWrite, pending, formError, onDelete } = props;

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
    <div className="flex flex-col gap-2">
      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

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
              <Popconfirm
                title="این برنامه حذف شود؟"
                onConfirm={() => onDelete(plan.id)}
                okButtonProps={{ loading: pending }}
                cancelText="لغو"
                okText="حذف"
              >
                <Button size="small" danger loading={pending}>
                  حذف
                </Button>
              </Popconfirm>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
