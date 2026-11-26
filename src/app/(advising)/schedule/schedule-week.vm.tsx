"use client";

import { useState } from "react";

import type { SubjectRow, WeeklyScheduleEntry } from "@/modules/advising/domain/models";

import { ScheduleWeekView } from "./schedule-week.view";
import type { SchoolProgramEntry } from "./_components/school-program-form.view";

interface ScheduleWeekVMProps {
  entries: WeeklyScheduleEntry[];
  schoolProgramEntries: SchoolProgramEntry[];
  canWrite: boolean;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function ScheduleWeekWrapper({
  entries,
  schoolProgramEntries,
  canWrite,
  fieldOfStudy,
  subjects,
  labels,
}: ScheduleWeekVMProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <ScheduleWeekView
      entries={entries}
      schoolProgramEntries={schoolProgramEntries}
      canWrite={canWrite}
      fieldOfStudy={fieldOfStudy}
      subjects={subjects}
      labels={labels}
      isFormOpen={isFormOpen}
      onOpenForm={() => setIsFormOpen(true)}
      onCloseForm={() => setIsFormOpen(false)}
    />
  );
}
