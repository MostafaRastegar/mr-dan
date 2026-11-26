"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { MealSlot } from "@/modules/advising/domain/energy";
import type { DashboardReadModel } from "@/modules/advising/application/dashboard";
import {
  type StudyBlock,
  studyBlockKey,
} from "@/modules/advising/domain/study-blocks";
import {
  addTestsAction,
  setHomeworkDoneAction,
  toggleMealSlotAction,
  toggleStudyBlockAction,
} from "./dashboard.actions";
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

  const onToggleBlock = useCallback(
    async (block: StudyBlock) => {
      setError(null);
      const completed = !overview.goal?.completedBlocks.includes(
        studyBlockKey(block),
      );
      const result = await toggleStudyBlockAction({
        dayKey: block.dayKey,
        startMinute: block.startMinute,
        minutes: block.minutes,
        subject: block.subject,
        completed,
      });
      if (result.ok) router.refresh();
      else setError(result.error.message);
    },
    [overview.goal?.completedBlocks],
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

  const onAddTests = useCallback(
    async (delta: number) => {
      setError(null);
      const result = await addTestsAction({ delta });
      if (result.ok) {
        setTestsDone(result.data.testsDone);
        router.refresh();
      } else {
        setError(result.error.message);
      }
    },
    [],
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
      onToggleBlock={onToggleBlock}
      onToggleMeal={onToggleMeal}
      onAddTests={onAddTests}
      error={error}
      labels={labels}
    />
  );
}
