"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { HomeworkItem, Page } from "@/modules/advising/domain/models";
import type { SubjectOption } from "@/modules/advising/domain/catalog";

import { HomeworkBoardView } from "./homework-board.view";

interface HomeworkBoardVMProps {
  pageData: Page<HomeworkItem>;
  canWrite: boolean;
  todayKey: string;
  labels: Record<string, string>;
  subjectOptions: SubjectOption[];
}

export function HomeworkBoardWrapper({
  pageData,
  canWrite,
  todayKey,
  labels,
  subjectOptions,
}: HomeworkBoardVMProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  return (
    <HomeworkBoardView
      items={pageData.items}
      onPageChange={(next) => router.push(`/homework?page=${next}`)}
      currentPage={pageData.page}
      total={pageData.total}
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
