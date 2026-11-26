import type { ReactNode } from "react";

import type { DayBudget } from "@/modules/advising/application/free-time";
import { durationMessage } from "@/modules/advising/domain/free-time";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface BudgetDayViewProps {
  day: DayBudget;
  datePicker: ReactNode;
  freeTimeForm: ReactNode;
  planForm: ReactNode;
  planList: ReactNode;
}

export function BudgetDayView(props: BudgetDayViewProps): ReactNode {
  const { day, datePicker, freeTimeForm, planForm, planList } = props;
  const capacity = day.freeMinutes ?? 0;
  // Fixed timeZone keeps server/client render identical; calendar matches
  // formatDeadline and the DatePicker (gregory).
  const dayTitle = new Intl.DateTimeFormat("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
    timeZone: "Asia/Tehran",
  }).format(new Date(`${day.dayKey}T00:00:00`));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">وقت آزاد</h1>
        <div className="flex items-center gap-2">
          {datePicker}
          <span className="text-sm text-slate-600">{dayTitle}</span>
        </div>
      </div>

      <section
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.BUDGET.DAY}
      >
        <h2 className="text-lg font-semibold">ظرفیت این روز</h2>

        <p className="text-sm text-slate-700">
          وقت آزاد:{" "}
          {day.freeMinutes === null ? "ثبت نشده" : formatClock(day.freeMinutes)}
        </p>

        <p className="text-sm text-slate-700" data-testid={TEST_IDS.BUDGET.USED}>
          مصرف‌شده: {durationMessage(day.usedMinutes, capacity)}
        </p>

        <p className="text-sm text-slate-700">
          باقی‌مانده: {formatClock(day.remainingMinutes)}
        </p>

        {day.freeMinutes === null ? (
          <p className="text-sm text-slate-600">
            پیشنهاد این روز: {formatClock(day.suggestedMinutes)}
          </p>
        ) : null}
      </section>

      {freeTimeForm}

      <div className="grid gap-4 lg:grid-cols-2">
        {planForm}
        <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">برنامهٔ این روز</h2>
          {planList}
        </section>
      </div>
    </div>
  );
}
