"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { MealSlot } from "@/modules/advising/domain/energy";
import type { DashboardReadModel } from "@/modules/advising/application/dashboard";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import { setHomeworkDoneAction, toggleMealSlotAction } from "./dashboard.actions";
import {
  setStudyMinutesAction,
  setSubjectTestsAction,
} from "../schedule/study-log.actions";
import { DashboardView } from "./dashboard.view";

interface DashboardWrapperProps {
  overview: DashboardReadModel;
  labels: Record<string, string>;
}

export function DashboardWrapper({
  overview,
  labels,
}: DashboardWrapperProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [homeworkMinutes, setHomeworkMinutesState] = useState<
    Map<string, number>
  >(new Map());
  const [testsDone, setTestsDone] = useState(overview.goal?.testsDone ?? 0);

  const setHomeworkMinutes = useCallback((id: string, minutes: number | null) => {
    setHomeworkMinutesState((prev) => {
      const next = new Map(prev);
      if (minutes === null) next.delete(id);
      else next.set(id, minutes);
      return next;
    });
  }, []);

  const onToggleHomework = useCallback(
    async (id: string) => {
      setError(null);
      const minutes = homeworkMinutes.get(id);
      if (minutes === null || minutes === undefined || minutes < 1 || minutes > 1440) return;
      const result = await setHomeworkDoneAction({ homeworkId: id, minutes });
      if (result.ok) {
        setHomeworkMinutes(id, null);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    },
    [homeworkMinutes],
  );

  const onSaveBlockMinutes = useCallback(
    async (block: StudyBlock, minutes: number) => {
      setError(null);
      if (!block.entryId) return;
      const result = await setStudyMinutesAction({
        dayKey: block.dayKey,
        entryId: block.entryId,
        minutes,
      });
      if (result.ok) router.refresh();
      else setError(result.error.message);
    },
    [router],
  );

  const onToggleMeal = useCallback(
    async (slot: string) => {
      setError(null);
      const eaten = !(overview.meal.plan?.eatenSlots ?? []).includes(slot);
      const result = await toggleMealSlotAction({ slot: slot as MealSlot, eaten });
      if (result.ok) router.refresh();
      else setError(result.error.message);
    },
    [overview.meal.plan?.eatenSlots],
  );

  const onSaveTests = useCallback(
    async (subject: string, count: number) => {
      setError(null);
      const result = await setSubjectTestsAction({ subject, count });
      if (result.ok) {
        setTestsDone(result.data.testsDone);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    },
    [router],
  );

  const studiedMinutes = overview.goal?.studiedMinutes ?? 0;

  return (
    <DashboardView
      overview={overview}
      studiedMinutes={studiedMinutes}
      homeworkMinutes={homeworkMinutes}
      testsDone={testsDone}
      onSetHomeworkMinutes={setHomeworkMinutes}
      onToggleHomework={onToggleHomework}
      onSaveBlockMinutes={onSaveBlockMinutes}
      onToggleMeal={onToggleMeal}
      onSaveTests={onSaveTests}
      error={error}
      labels={labels}
    />
  );
}
