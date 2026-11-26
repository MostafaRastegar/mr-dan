"use client";

import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import type { Chapter, SubjectRow } from "@/modules/advising/domain/models";

import { CounselorStudentView } from "./counselor-student.view";

interface CounselorStudentVMProps {
  studentId: string;
  view: StudentStudyPlanView;
  chapters: Chapter[];
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function CounselorStudentWrapper({
  studentId,
  view,
  chapters,
  subjects,
  labels,
}: CounselorStudentVMProps) {
  return (
    <CounselorStudentView
      studentId={studentId}
      view={view}
      chapters={chapters}
      subjects={subjects}
      labels={labels}
    />
  );
}
