"use client";

import { useState } from "react";

import type { HomeworkItem } from "@/modules/advising/domain/models";

import { HomeworkBoardView } from "./homework-board.view";

interface HomeworkBoardVMProps {
  items: HomeworkItem[];
  canWrite: boolean;
  todayKey: string;
}

export function HomeworkBoardWrapper({
  items,
  canWrite,
  todayKey,
}: HomeworkBoardVMProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <HomeworkBoardView
      items={items}
      canWrite={canWrite}
      todayKey={todayKey}
      isFormOpen={isFormOpen}
      onOpenForm={() => setIsFormOpen(true)}
      onCloseForm={() => setIsFormOpen(false)}
    />
  );
}
