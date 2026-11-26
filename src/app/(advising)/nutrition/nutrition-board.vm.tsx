"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useActionMutation } from "@/utils/use-form-action";
import type { NutritionOverview } from "@/modules/advising/application/nutrition";

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
  const { state, run, pending } = useActionMutation(saveMealPlanAction);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  return (
    <NutritionBoardView
      overview={overview}
      canWrite={canWrite}
      saveState={state}
      pending={pending}
      onSavePlan={() => run()}
    />
  );
}
