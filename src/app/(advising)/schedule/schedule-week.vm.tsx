"use client";

import { useState } from "react";

import type { WeeklyScheduleEntry } from "@/modules/advising/domain/models";

import { ScheduleWeekView } from "./schedule-week.view";

interface ScheduleWeekVMProps {
  entries: WeeklyScheduleEntry[];
  canWrite: boolean;
  fieldOfStudy: string | null;
}

export function ScheduleWeekWrapper({
  entries,
  canWrite,
  fieldOfStudy,
}: ScheduleWeekVMProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <ScheduleWeekView
      entries={entries}
      canWrite={canWrite}
      fieldOfStudy={fieldOfStudy}
      isFormOpen={isFormOpen}
      onOpenForm={() => setIsFormOpen(true)}
      onCloseForm={() => setIsFormOpen(false)}
    />
  );
}
