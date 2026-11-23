import type { ReactNode } from "react";
import { Button } from "antd";

import type { EnergyEstimate } from "@/modules/advising/application/nutrition";
import type { MealPlanRecord } from "@/modules/advising/domain/models";
import { formatCalories, formatMealSlot } from "@/modules/advising/presentation/nutrition-format";
import type { ActionState } from "@/utils/app-error";

import { TEST_IDS } from "@/constants/test-ids";

interface MealPlanViewProps {
  energy: EnergyEstimate | null;
  plan: MealPlanRecord | null;
  canWrite: boolean;
  saveState: ActionState<{ dayKey: string }> | null;
  pending: boolean;
  onSave: () => void;
}

export function MealPlanView(props: MealPlanViewProps): ReactNode {
  const { energy, plan, canWrite, saveState, pending, onSave } = props;

  if (!energy) {
    return (
      <section
        className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900"
        data-testid={TEST_IDS.NUTRITION.INCOMPLETE}
      >
        برای محاسبهٔ کالری، ابتدا اطلاعات فیزیکی خود را کامل کنید.
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-slate-500">سوخت‌وساز پایه (BMR)</dt>
            <dd className="text-xl font-bold" data-testid={TEST_IDS.NUTRITION.BMR}>
              {formatCalories(energy.bmr)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">کالری روزانه (TDEE)</dt>
            <dd className="text-xl font-bold" data-testid={TEST_IDS.NUTRITION.TDEE}>
              {formatCalories(energy.tdee)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">هدف کالری</dt>
            <dd className="text-xl font-bold" data-testid={TEST_IDS.NUTRITION.TARGET}>
              {formatCalories(energy.targetCalories)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          این اعداد تخمینی است و جایگزین نظر پزشک نیست.
        </p>

        {canWrite ? (
          <Button
            type="primary"
            className="mt-4"
            onClick={onSave}
            loading={pending}
            data-testid={TEST_IDS.NUTRITION.SAVE_PLAN}
          >
            ثبت برنامهٔ امروز
          </Button>
        ) : null}

        {saveState && !saveState.ok ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {saveState.error.message}
          </p>
        ) : null}

        {saveState?.ok ? (
          <p className="mt-3 text-sm text-teal-700" role="status">
            برنامهٔ امروز ذخیره شد.
          </p>
        ) : null}
      </section>

      {plan ? (
        <section
          className="rounded-xl border border-slate-200 bg-white p-5"
          data-testid={TEST_IDS.NUTRITION.PLAN}
        >
          <h2 className="mb-3 text-lg font-semibold">وعده‌های امروز</h2>
          <ul className="flex flex-col gap-2">
            {plan.meals.map((meal) => (
              <li key={meal.slot} className="flex items-center justify-between text-sm">
                <span>{formatMealSlot(meal.slot)}</span>
                <span dir="ltr">{formatCalories(meal.calories)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
