"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteScheduleEntryAction } from "../schedule.actions";
import { ScheduleControlsView } from "./schedule-controls.view";

export function ScheduleControlsVM({ entryId }: { entryId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteScheduleEntryAction(entryId);
      router.refresh();
    });
  };

  return (
    <ScheduleControlsView entryId={entryId} isPending={isPending} onDelete={handleDelete} />
  );
}
