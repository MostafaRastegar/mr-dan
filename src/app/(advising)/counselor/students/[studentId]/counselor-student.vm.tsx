"use client";

import { useState } from "react";
import { Form } from "antd";

import { subjectLabel } from "@/modules/advising/domain/subjects";

import { CHAPTERS, type CounselorStudentData, type ChapterOption } from "./counselor-student.fixture";

import { CounselorStudentView } from "./counselor-student.view";

interface CounselorStudentVMProps {
  data: CounselorStudentData;
  demo: "success" | "empty" | "loading" | "error";
}

export function CounselorStudentWrapper({
  data,
  demo,
}: CounselorStudentVMProps) {
  const [form] = Form.useForm();

  // Local state for the plan editor (no server writes in UI stage).
  const [testsTarget, setTestsTarget] = useState<string | null>(
    data.plan?.testsTarget != null ? String(data.plan.testsTarget) : "300",
  );
  const [planChapter, setPlanChapter] = useState<string[]>([]);
  const [planNote, setPlanNote] = useState<string | null>(null);
  const [planEntries, setPlanEntries] = useState(
    data.plan?.entries.slice() ?? [],
  );

  const handleAddEntry = (
    dayOfWeek: number,
    subject: string,
    hours: number,
    chapterIds: string[],
    note: string | null,
  ) => {
    setPlanEntries((prev) => [
      ...prev,
      {
        id: `pe-new-${Date.now()}`,
        dayOfWeek,
        subject,
        subjectLabel: subjectLabel(subject),
        minutes: Math.round(hours * 60),
        hours,
        chapterIds,
        note,
      },
    ]);
  };

  const handleDeleteEntry = (id: string) => {
    setPlanEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const weeklyTotal = planEntries.reduce((sum, e) => sum + e.minutes, 0);

  const subjectTotals: Record<string, number> = {};
  for (const entry of planEntries) {
    subjectTotals[entry.subject] = (subjectTotals[entry.subject] ?? 0) + entry.minutes;
  }

  const selectedSubject = form.getFieldValue("planSubject") as string | undefined;
  const availableChapters: ChapterOption[] = CHAPTERS.filter(
    (c) =>
      c.subject === selectedSubject
      && c.active
      && c.grade === data.grade
      && (c.field === "" || c.field === data.fieldOfStudy),
  );

  return (
    <CounselorStudentView
      data={data}
      demo={demo}
      form={form}
      testsTarget={testsTarget}
      planEntries={planEntries}
      weeklyTotal={weeklyTotal}
      subjectTotals={subjectTotals}
      setTestsTarget={setTestsTarget}
      handleAddEntry={handleAddEntry}
      handleDeleteEntry={handleDeleteEntry}
      availableChapters={availableChapters}
      planChapter={planChapter}
      setPlanChapter={setPlanChapter}
      planNote={planNote}
      setPlanNote={setPlanNote}
    />
  );
}
