"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { NutritionOverview } from "@/modules/advising/application/nutrition";
import type { ActionState } from "@/utils/app-error";

import { saveMealPlanAction } from "./nutrition.actions";
import { NutritionBoardView } from "./nutrition-board.view";

interface NutritionBoardWrapperProps {
  overview: NutritionOverview;
  canWrite: boolean;
}

export function NutritionBoardWrapper({
  overview,
  canWrite,
}: NutritionBoardWrapperProps) {
  const router = useRouter();
  const [saveState, setSaveState] = useState<ActionState<{ dayKey: string }> | null>(null);
  const [pending, startTransition] = useTransition();

  const onSavePlan = () => {
    startTransition(async () => {
      const result = await saveMealPlanAction();
      setSaveState(result);
      if (result.ok) router.refresh();
    });
  };

  return (
    <NutritionBoardView
      overview={overview}
      canWrite={canWrite}
      saveState={saveState}
      pending={pending}
      onSavePlan={onSavePlan}
    />
  );
}
