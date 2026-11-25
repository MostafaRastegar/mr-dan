import type { ReactNode } from "react";
import { Button } from "antd";
import Link from "next/link";
import type { MealPlanRecord } from "@/modules/advising/domain/models";
import { mealDistribution, type MealSlot } from "@/modules/advising/domain/energy";
import { TEST_IDS } from "@/constants/test-ids";

interface NutritionWidgetViewProps {
  plan: MealPlanRecord | null;
  eatenSlots: Set<string>;
  targetCalories: number | null;
  hasPhysicalProfile: boolean;
  onToggleMeal: (slot: string) => void;
}

function mealEaten(slot: MealSlot, eatenSlots: Set<string>): boolean {
  return eatenSlots.has(slot);
}

export function NutritionWidgetView(props: NutritionWidgetViewProps): ReactNode {
  const { eatenSlots, targetCalories, hasPhysicalProfile, onToggleMeal } = props;

  if (!hasPhysicalProfile || !targetCalories) {
    return (
      <section
        className="rounded-xl border border-slate-200 bg-white p-5"
        data-testid={TEST_IDS.DASHBOARD.CARD("calorie")}
      >
        <h2 className="mb-3 text-lg font-semibold">کالوری امروز</h2>
        <p className="mb-3 text-sm text-slate-500">
          اطلاعات فیزیکی را در تنظیمات تغذیه کامل کنید
        </p>
        <Link
          href="/nutrition"
          className="inline-flex items-center gap-1 text-teal-600 hover:underline"
          data-testid={TEST_IDS.DASHBOARD.CALORIE_SETTINGS_LINK}
        >
          تکمیل پروفایل تغذیه
        </Link>
      </section>
    );
  }

  const eatenCalories = mealDistribution(targetCalories).reduce(
    (sum, item) => (mealEaten(item.slot, eatenSlots) ? sum + item.calories : sum),
    0,
  );
  const percent = Math.min(100, Math.round((eatenCalories / targetCalories) * 100));

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.DASHBOARD.CARD("calorie")}
    >
      <h2 className="mb-3 text-lg font-semibold">کالوری امروز</h2>
      <div className="mb-3 flex items-baseline gap-1">
        <span className="text-lg font-mono font-bold text-slate-900" dir="ltr">
          {eatenCalories}
        </span>
        <span className="text-xs text-slate-500">/{targetCalories} کالوری</span>
      </div>
      <ul className="flex flex-col gap-2 mb-4">
        {mealDistribution(targetCalories).map((item) => {
          const eaten = mealEaten(item.slot, eatenSlots);
          return (
            <li
              key={item.slot}
              className="flex items-center justify-between gap-2 rounded border border-slate-200 p-2"
            >
              <span className="text-sm">
                {item.label} — {item.calories} کالوری
              </span>
              <Button
                size="small"
                onClick={() => onToggleMeal(item.slot)}
                className={eaten ? "bg-teal-600 text-white" : "bg-white text-slate-700 border border-slate-300"}
                data-testid={TEST_IDS.DASHBOARD.MEAL_TOGGLE(item.slot)}
              >
                {eaten ? "بسته شد" : "بخورم"}
              </Button>
              <span
                className={`text-xs font-medium ${eaten ? "text-teal-700" : "text-slate-400"}`}
                data-testid={TEST_IDS.DASHBOARD.MEAL_EATEN(item.slot)}
              >
                {eaten ? "خورده" : " "}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="text-xs text-slate-500" dir="ltr">
        مصرف شده: {percent}%
      </div>
    </section>
  );
}
