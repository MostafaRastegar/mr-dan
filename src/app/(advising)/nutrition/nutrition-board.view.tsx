import type { ReactNode } from "react";

import type { NutritionOverview } from "@/modules/advising/application/nutrition";
import type { ActionState } from "@/utils/app-error";

import { PhysicalForm } from "./_components/physical-form.vm";
import { MealPlanView } from "./_components/meal-plan.view";

interface NutritionBoardViewProps {
  overview: NutritionOverview;
  canWrite: boolean;
  saveState: ActionState<{ dayKey: string }> | null;
  pending: boolean;
  onSavePlan: () => void;
}

export function NutritionBoardView(props: NutritionBoardViewProps): ReactNode {
  const { overview, canWrite, saveState, pending, onSavePlan } = props;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">تغذیه و کالری</h1>
      </div>

      {canWrite ? <PhysicalForm profile={overview.profile} /> : null}

      <MealPlanView
        energy={overview.energy}
        plan={overview.todayPlan}
        canWrite={canWrite}
        saveState={saveState}
        pending={pending}
        onSave={onSavePlan}
      />
    </div>
  );
}
