"use client";

import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import type { Chapter } from "@/modules/advising/domain/models";

import { CounselorStudentView } from "./counselor-student.view";

interface CounselorStudentVMProps {
  studentId: string;
  view: StudentStudyPlanView;
  chapters: Chapter[];
}

export function CounselorStudentWrapper({
  studentId,
  view,
  chapters,
}: CounselorStudentVMProps) {
  return (
    <CounselorStudentView
      studentId={studentId}
      view={view}
      chapters={chapters}
    />
  );
}
