"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useActionMutation } from "@/utils/use-form-action";

import { deleteScheduleEntryAction } from "../schedule.actions";
import { ScheduleControlsView } from "./schedule-controls.view";

export function ScheduleControlsVM({ entryId }: { entryId: string }) {
  const router = useRouter();
  const { state, run, pending } = useActionMutation(deleteScheduleEntryAction);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  return (
    <ScheduleControlsView
      entryId={entryId}
      isPending={pending}
      onDelete={() => run({ id: entryId })}
    />
  );
}
