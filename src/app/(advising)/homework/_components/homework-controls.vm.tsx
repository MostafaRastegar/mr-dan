"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useActionMutation } from "@/utils/use-form-action";

import { toggleHomeworkAction, deleteHomeworkAction } from "../homework.actions";
import { HomeworkControlsView } from "./homework-controls.view";

interface HomeworkControlsVMProps {
  itemId: string;
  completed: boolean;
}

export function HomeworkControlsVM({ itemId, completed }: HomeworkControlsVMProps) {
  const router = useRouter();
  const { state: toggleState, run: runToggle, pending: togglePending } =
    useActionMutation(toggleHomeworkAction);
  const { state: deleteState, run: runDelete, pending: deletePending } =
    useActionMutation(deleteHomeworkAction);

  useEffect(() => {
    if (!toggleState?.ok) return;
    router.refresh();
  }, [toggleState, router]);

  useEffect(() => {
    if (!deleteState?.ok) return;
    router.refresh();
  }, [deleteState, router]);

  return (
    <HomeworkControlsView
      itemId={itemId}
      completed={completed}
      isPending={togglePending || deletePending}
      onToggle={() => runToggle({ id: itemId, completed: !completed })}
      onDelete={() => runDelete({ id: itemId })}
    />
  );
}
