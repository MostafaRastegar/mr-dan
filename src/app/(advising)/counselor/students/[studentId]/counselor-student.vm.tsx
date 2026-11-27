"use client";

import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import type { Chapter, SubjectRow } from "@/modules/advising/domain/models";

import { CounselorStudentView } from "./counselor-student.view";
import type { SupervisionSections } from "./_components/supervision-sections.view";

interface CounselorStudentVMProps {
  studentId: string;
  view: StudentStudyPlanView;
  canWrite: boolean;
  supervision: SupervisionSections | null;
  chapters: Chapter[];
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function CounselorStudentWrapper({
  studentId,
  view,
  canWrite,
  supervision,
  chapters,
  subjects,
  labels,
}: CounselorStudentVMProps) {
  return (
    <CounselorStudentView
      studentId={studentId}
      view={view}
      canWrite={canWrite}
      supervision={supervision}
      chapters={chapters}
      subjects={subjects}
      labels={labels}
    />
  );
}
