"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useActionMutation } from "@/utils/use-form-action";
import type { Chapter, StudyPlanEntry } from "@/modules/advising/domain/models";

import { deleteStudyPlanEntryAction } from "../study-plan.actions";
import { StudyPlanTableView } from "./study-plan-table.view";

export function StudyPlanTable({
  studentId,
  entries,
  chapters,
  labels,
  canWrite,
}: {
  studentId: string;
  entries: StudyPlanEntry[];
  chapters: Chapter[];
  labels: Record<string, string>;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { state, run, pending } = useActionMutation(deleteStudyPlanEntryAction);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const formError = state && !state.ok ? state.error.message : null;

  return (
    <StudyPlanTableView
      entries={entries}
      chapters={chapters}
      labels={labels}
      canWrite={canWrite}
      pending={pending}
      formError={formError}
      onDelete={(entryId) => run({ studentId, entryId })}
    />
  );
}
