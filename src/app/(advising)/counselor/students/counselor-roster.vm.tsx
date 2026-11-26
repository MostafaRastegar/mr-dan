"use client";

import { useRouter } from "next/navigation";

import type {
  GroupSummary,
  Page,
  StudentSummary,
} from "@/modules/advising/domain/models";
import { CounselorRosterView } from "./counselor-roster.view";

export function CounselorRosterWrapper({
  groups,
  myStudents,
  unassigned,
  assignable,
  fieldOptions,
  gradeOptions,
}: {
  groups: GroupSummary[];
  myStudents: Page<StudentSummary>;
  unassigned: Page<StudentSummary>;
  assignable: StudentSummary[];
  fieldOptions: string[];
  gradeOptions: string[];
}) {
  const router = useRouter();

  const navigate = (patch: { myPage?: number; unPage?: number }) => {
    const query = new URLSearchParams();
    query.set("myPage", String(patch.myPage ?? myStudents.page));
    query.set("unPage", String(patch.unPage ?? unassigned.page));
    router.push(`/counselor/students?${query.toString()}`);
  };

  return (
    <CounselorRosterView
      groups={groups}
      myStudents={myStudents}
      unassigned={unassigned}
      assignable={assignable}
      onPageMy={(page) => navigate({ myPage: page })}
      onPageUnassigned={(page) => navigate({ unPage: page })}
      fieldOptions={fieldOptions}
      gradeOptions={gradeOptions}
    />
  );
}
