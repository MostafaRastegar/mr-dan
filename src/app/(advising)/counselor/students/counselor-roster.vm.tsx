"use client";

import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";
import { CounselorRosterView } from "./counselor-roster.view";

export function CounselorRosterWrapper({
  groups,
  students,
}: {
  groups: GroupSummary[];
  students: StudentSummary[];
}) {
  return <CounselorRosterView groups={groups} students={students} />;
}
