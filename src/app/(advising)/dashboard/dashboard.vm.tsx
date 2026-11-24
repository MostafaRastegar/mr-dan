"use client";

import { useCallback, useState } from "react";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import { studyBlockKey } from "@/modules/advising/domain/study-blocks";
import type { DashboardData } from "./dashboard.fixture";
import { DashboardView } from "./dashboard.view";

interface DashboardWrapperProps {
  data: DashboardData;
  demo: "success" | "empty" | "loading" | "error";
}

export function DashboardWrapper({ data, demo }: DashboardWrapperProps) {
  const [tickedHomework, setTickedHomework] = useState<Map<string, number>>(new Map());
  const [tickedBlocks, setTickedBlocks] = useState<Set<string>>(new Set());
  const [eatenSlots, setEatenSlots] = useState<Set<string>>(new Set());
  const [testsDone, setTestsDone] = useState<number>(data.goal?.testsDone ?? 0);
  const [homeworkMinutes, setHomeworkMinutesState] = useState<Map<string, number>>(new Map());

  const setHomeworkMinutes = useCallback((id: string, minutes: number | null) => {
    setHomeworkMinutesState((prev) => {
      const next = new Map(prev);
      if (minutes === null) next.delete(id);
      else next.set(id, minutes);
      return next;
    });
  }, []);

  const toggleHomework = useCallback((id: string) => {
    const minutes = homeworkMinutes.get(id);
    if (minutes === null || minutes === undefined || minutes < 1 || minutes > 1440) return;
    setTickedHomework((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, minutes);
      return next;
    });
    setHomeworkMinutes(id, null);
  }, [homeworkMinutes, setHomeworkMinutes]);

  const toggleBlock = useCallback((block: StudyBlock) => {
    const key = studyBlockKey(block);
    setTickedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleMeal = useCallback((slot: string) => {
    setEatenSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }, []);

  const addTests = useCallback((delta: number) => {
    setTestsDone((prev) => prev + delta);
  }, []);

  const studiedMinutes = Array.from(tickedBlocks).reduce((sum, key) => {
    const block = data.blocks.find((b) => studyBlockKey(b) === key);
    return sum + (block?.minutes ?? 0);
  }, 0);

  return (
    <DashboardView
      data={data}
      demo={demo}
      tickedHomework={tickedHomework}
      homeworkMinutes={homeworkMinutes}
      tickedBlocks={tickedBlocks}
      eatenSlots={eatenSlots}
      testsDone={testsDone}
      studiedMinutes={studiedMinutes}
      onToggleHomework={toggleHomework}
      onSetHomeworkMinutes={setHomeworkMinutes}
      onToggleBlock={toggleBlock}
      onToggleMeal={toggleMeal}
      onAddTests={addTests}
    />
  );
}
