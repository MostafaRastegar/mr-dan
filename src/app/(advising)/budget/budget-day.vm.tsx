"use client";

import { DatePicker } from "antd";
import { useRouter } from "next/navigation";

import type { DayBudget } from "@/modules/advising/application/free-time";
import { dateToDayKey } from "@/modules/advising/presentation/time-value";
import { TEST_IDS } from "@/constants/test-ids";

import { PlanListView } from "./_components/plan-list.view";
import { FreeTimeForm } from "./_components/free-time-form.vm";
import { PlanForm } from "./_components/plan-form.vm";
import { deletePlanAction } from "./budget.actions";

import { BudgetDayView } from "./budget-day.view";

interface BudgetDayVMProps {
  day: DayBudget;
  canWrite: boolean;
}

export function BudgetDayWrapper({ day, canWrite }: BudgetDayVMProps) {
  const router = useRouter();

  // The picker cannot be seeded with a stored date (no `dayjs` import), so the
  // current day is rendered as text and a pick only navigates.
  const pickDate = (value: unknown) => {
    const dayKey = dateToDayKey(value);
    if (dayKey) router.push(`/budget?date=${dayKey}`);
  };

  return (
    <BudgetDayView
      day={day}
      datePicker={
        <DatePicker
          onChange={pickDate}
          allowClear={false}
          placeholder="انتخاب روز"
          data-testid={TEST_IDS.BUDGET.DAY_PICKER}
        />
      }
      freeTimeForm={
        <FreeTimeForm
          dayKey={day.dayKey}
          freeMinutes={day.freeMinutes}
          suggestedMinutes={day.suggestedMinutes}
        />
      }
      planForm={<PlanForm dayKey={day.dayKey} candidates={day.candidates} />}
      planList={
        <PlanListView
          plans={day.plans}
          canWrite={canWrite}
          deletePlan={deletePlanAction}
        />
      }
    />
  );
}
