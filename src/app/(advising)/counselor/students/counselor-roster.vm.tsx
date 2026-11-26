"use client";

import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";
import { CounselorRosterView } from "./counselor-roster.view";

export function CounselorRosterWrapper({
  groups,
  myStudents,
  unassigned,
  fieldOptions,
  gradeOptions,
}: {
  groups: GroupSummary[];
  myStudents: StudentSummary[];
  unassigned: StudentSummary[];
  fieldOptions: string[];
  gradeOptions: string[];
}) {
  return (
    <CounselorRosterView
      groups={groups}
      myStudents={myStudents}
      unassigned={unassigned}
      fieldOptions={fieldOptions}
      gradeOptions={gradeOptions}
    />
  );
}
