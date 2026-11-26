"use client";

import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";
import { CounselorRosterView } from "./counselor-roster.view";

export function CounselorRosterWrapper({
  groups,
  students,
  fieldOptions,
  gradeOptions,
}: {
  groups: GroupSummary[];
  students: StudentSummary[];
  fieldOptions: string[];
  gradeOptions: string[];
}) {
  return (
    <CounselorRosterView
      groups={groups}
      students={students}
      fieldOptions={fieldOptions}
      gradeOptions={gradeOptions}
    />
  );
}
