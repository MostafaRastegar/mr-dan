"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useActionMutation } from "@/utils/use-form-action";
import type { DayPlan } from "@/modules/advising/application/free-time";

import { deletePlanAction } from "../budget.actions";
import { PlanListView } from "./plan-list.view";

interface PlanListProps {
  plans: DayPlan[];
  canWrite: boolean;
}

export function PlanList({ plans, canWrite }: PlanListProps) {
  const router = useRouter();
  const { state, run, pending } = useActionMutation(deletePlanAction);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const formError = state && !state.ok ? state.error.message : null;

  return (
    <PlanListView
      plans={plans}
      canWrite={canWrite}
      pending={pending}
      formError={formError}
      onDelete={(id) => run({ id })}
    />
  );
}
