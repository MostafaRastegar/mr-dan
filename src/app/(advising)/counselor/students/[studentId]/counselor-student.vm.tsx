"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { useRouter } from "next/navigation";

import {
  saveStudyPlanHeaderAction,
  addStudyPlanEntryAction,
  deleteStudyPlanEntryAction,
} from "./study-plan.actions";
import { CounselorStudentView } from "./counselor-student.view";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import type { Chapter } from "@/modules/advising/domain/models";

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
  const [form] = Form.useForm();
  const router = useRouter();

  const [testsTarget, setTestsTarget] = useState<string | null>(
    view.plan?.testsTarget != null ? String(view.plan.testsTarget) : "",
  );
  const [planChapter, setPlanChapter] = useState<string[]>([]);
  const [planNote, setPlanNote] = useState<string | null>(null);
  const [planEntries] = useState(
    view.plan?.entries.slice() ?? [],
  );

  const { state: headerState, submit: submitHeader, pending: headerPending } =
    useFormAction(saveStudyPlanHeaderAction);
  const headerError = useServerFormErrors(headerState, form);
  useEffect(() => {
    if (headerState?.ok) router.refresh();
  }, [headerState]);

  const { state: addState, submit: addSubmit, pending: addPending } =
    useFormAction(addStudyPlanEntryAction);
  useEffect(() => {
    if (addState?.ok) {
      setPlanChapter([]);
      setPlanNote(null);
      router.refresh();
    }
  }, [addState]);

  const { state: deleteState, submit: deleteSubmit, pending: deletePending } =
    useFormAction(deleteStudyPlanEntryAction);
  useEffect(() => {
    if (deleteState?.ok) router.refresh();
  }, [deleteState]);

  const handleDeleteEntry = (id: string) => {
    deleteSubmit({ studentId, entryId: id });
  };

  const handleSaveHeader = () => {
    submitHeader({
      studentId,
      testsTarget: testsTarget != null ? Number(testsTarget) : 0,
    });
  };

  const handleAddEntry = () => {
    const dayOfWeek = form.getFieldValue("planDay");
    const subject = form.getFieldValue("planSubject") as string;
    const hours = Number(form.getFieldValue("planHours"));
    if (!dayOfWeek || !subject || !hours) return;
    addSubmit({
      studentId,
      dayOfWeek: Number(dayOfWeek),
      subject,
      hours,
      chapterIds: JSON.stringify(planChapter),
      note: planNote,
    });
    form.setFieldsValue({ planDay: "", planSubject: "", planHours: "" });
    setPlanChapter([]);
    setPlanNote(null);
  };

  const weeklyTotal = planEntries.reduce((sum, e) => sum + e.minutes, 0);

  const subjectTotals: Record<string, number> = {};
  for (const entry of planEntries) {
    subjectTotals[entry.subject] = (subjectTotals[entry.subject] ?? 0) + entry.minutes;
  }

  const selectedSubject = form.getFieldValue("planSubject") as string | undefined;
  const availableChapters = chapters.filter(
    (c) => c.subject === selectedSubject && c.active,
  );

  const addError = addState && !addState.ok ? addState.error.message : null;
  const deleteError = deleteState && !deleteState.ok ? deleteState.error.message : null;
  const formError = headerError ?? addError ?? deleteError;

  return (
    <CounselorStudentView
      studentId={studentId}
      view={view}
      chapters={chapters}
      availableChapters={availableChapters}
      form={form}
      testsTarget={testsTarget}
      setTestsTarget={setTestsTarget}
      planEntries={planEntries}
      weeklyTotal={weeklyTotal}
      subjectTotals={subjectTotals}
      handleSaveHeader={handleSaveHeader}
      handleAddEntry={handleAddEntry}
      handleDeleteEntry={handleDeleteEntry}
      planChapter={planChapter}
      setPlanChapter={setPlanChapter}
      planNote={planNote}
      setPlanNote={setPlanNote}
      formError={formError}
      pending={headerPending || addPending || deletePending}
    />
  );
}
