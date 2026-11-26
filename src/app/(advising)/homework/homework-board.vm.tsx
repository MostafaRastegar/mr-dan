"use client";

import { useState } from "react";

import type { HomeworkItem } from "@/modules/advising/domain/models";
import type { SubjectOption } from "@/modules/advising/domain/catalog";

import { HomeworkBoardView } from "./homework-board.view";

interface HomeworkBoardVMProps {
  items: HomeworkItem[];
  canWrite: boolean;
  todayKey: string;
  labels: Record<string, string>;
  subjectOptions: SubjectOption[];
}

export function HomeworkBoardWrapper({
  items,
  canWrite,
  todayKey,
  labels,
  subjectOptions,
}: HomeworkBoardVMProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <HomeworkBoardView
      items={items}
      canWrite={canWrite}
      todayKey={todayKey}
      labels={labels}
      subjectOptions={subjectOptions}
      isFormOpen={isFormOpen}
      onOpenForm={() => setIsFormOpen(true)}
      onCloseForm={() => setIsFormOpen(false)}
    />
  );
}
