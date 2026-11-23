"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleHomeworkAction, deleteHomeworkAction } from "../homework.actions";
import { HomeworkControlsView } from "./homework-controls.view";

interface HomeworkControlsVMProps {
  itemId: string;
  completed: boolean;
}

export function HomeworkControlsVM({ itemId, completed }: HomeworkControlsVMProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleHomeworkAction(itemId, !completed);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteHomeworkAction(itemId);
      router.refresh();
    });
  };

  return (
    <HomeworkControlsView
      itemId={itemId}
      completed={completed}
      isPending={isPending}
      onToggle={handleToggle}
      onDelete={handleDelete}
    />
  );
}
