import type { ReactNode } from "react";
import { Empty, Tag } from "antd";

import type { HomeworkItem } from "@/modules/advising/domain/models";
import type { NutritionOverview } from "@/modules/advising/application/nutrition";
import type { DayBudget } from "@/modules/advising/application/free-time";
import { labelOf } from "@/modules/advising/domain/catalog";
import {
  formatDeadline,
  formatNumber,
  homeworkStatus,
  type HomeworkStatus,
} from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

/** Read-only supervision payload (admin): real read use cases, view-only. */
export interface SupervisionSections {
  homework: HomeworkItem[];
  nutrition: NutritionOverview;
  budget: DayBudget;
}

const PRIORITY_LABEL: Record<HomeworkItem["priority"], string> = {
  high: "فوری",
  medium: "متوسط",
  low: "کم",
};

const STATUS_LABEL: Record<HomeworkStatus, string> = {
  done: "انجام‌شده",
  overdue: "عقب‌افتاده",
  today: "امروز",
  upcoming: "پیش‌رو",
};

const STATUS_COLOR: Record<HomeworkStatus, string> = {
  done: "green",
  overdue: "red",
  today: "gold",
  upcoming: "default",
};

interface SupervisionSectionsViewProps {
  supervision: SupervisionSections;
  labels: Record<string, string>;
}

export function SupervisionSectionsView(
  props: SupervisionSectionsViewProps,
): ReactNode {
  const { supervision, labels } = props;
  const { homework, nutrition, budget } = supervision;
  const todayKey = nutrition.todayKey;
  const energy = nutrition.energy;
  const meals = nutrition.todayPlan?.meals ?? [];

  return (
    <>
      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.SUPERVISION.HOMEWORK}
      >
        <h2 className="mb-3 text-lg font-semibold">تکالیف دانش‌آموز</h2>
        {homework.length === 0 ? (
          <Empty description="تکلیفی ثبت نشده است" />
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {homework.map((item) => {
              const status = homeworkStatus(item, todayKey);
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{item.title}</span>
                    <span className="text-slate-500">
                      {item.subject ? labelOf(labels, item.subject) : "عمومی"}
                    </span>
                    <Tag>{PRIORITY_LABEL[item.priority]}</Tag>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-slate-500">
                    <span className="whitespace-nowrap">
                      مهلت: {formatDeadline(item.deadline)}
                    </span>
                    <Tag color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Tag>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.SUPERVISION.NUTRITION}
      >
        <h2 className="mb-3 text-lg font-semibold">تغذیه</h2>
        {energy === null ? (
          <p className="text-sm text-slate-500">
            پروفایل بدنی دانش‌آموز کامل نیست؛ هدف کالری محاسبه نشده است.
          </p>
        ) : (
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded border border-slate-100 p-2 text-sm">
              <span className="block text-slate-500">سوخت‌وساز پایه</span>
              <span className="dir-ltr font-semibold">
                {formatNumber(energy.bmr)} کالری
              </span>
            </div>
            <div className="rounded border border-slate-100 p-2 text-sm">
              <span className="block text-slate-500">انرژی روزانه</span>
              <span className="dir-ltr font-semibold">
                {formatNumber(energy.tdee)} کالری
              </span>
            </div>
            <div className="rounded border border-slate-100 p-2 text-sm">
              <span className="block text-slate-500">هدف کالری</span>
              <span className="dir-ltr font-semibold">
                {formatNumber(energy.targetCalories)} کالری
              </span>
            </div>
          </div>
        )}
        {meals.length === 0 ? (
          <p className="text-sm text-slate-500">برنامهٔ غذایی برای امروز ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {meals.map((meal) => {
              const eaten = nutrition.todayPlan?.eatenSlots.includes(meal.slot);
              return (
                <li
                  key={meal.slot}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="font-medium">{meal.label}</span>
                  <span className="flex items-center gap-2 text-slate-500">
                    <span className="dir-ltr">{formatNumber(meal.calories)} کالری</span>
                    <Tag color={eaten ? "green" : "default"}>
                      {eaten ? "خورده" : "نخورده"}
                    </Tag>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.SUPERVISION.BUDGET}
      >
        <h2 className="mb-3 text-lg font-semibold">وقت آزاد</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            { label: "سقف ثبت‌شده", value: budget.freeMinutes },
            { label: "پیشنهادی", value: budget.suggestedMinutes },
            { label: "برنامه‌ریزی‌شده", value: budget.usedMinutes },
            { label: "باقی‌مانده", value: budget.remainingMinutes },
          ].map((cell) => (
            <div key={cell.label} className="rounded border border-slate-100 p-2 text-sm">
              <span className="block text-slate-500">{cell.label}</span>
              <span className="dir-ltr font-semibold">
                {cell.value === null ? "—" : `${formatNumber(cell.value)} دقیقه`}
              </span>
            </div>
          ))}
        </div>
        {budget.plans.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            برای امروز برنامهٔ مطالعه‌ای ثبت نشده است.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {budget.plans.map((plan) => (
              <li
                key={plan.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="font-medium">{plan.title}</span>
                <span className="dir-ltr text-slate-500">
                  {formatNumber(plan.plannedMinutes)} دقیقه
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
