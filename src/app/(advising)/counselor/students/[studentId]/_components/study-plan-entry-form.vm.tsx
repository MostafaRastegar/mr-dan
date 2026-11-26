"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";
import type { Chapter } from "@/modules/advising/domain/models";
import type { SubjectOption } from "@/modules/advising/domain/catalog";

import { addStudyPlanEntryAction } from "../study-plan.actions";
import { StudyPlanEntryFormView } from "./study-plan-entry-form.view";

export function StudyPlanEntryForm({
  studentId,
  chapters,
  subjectOptions,
}: {
  studentId: string;
  chapters: Chapter[];
  subjectOptions: SubjectOption[];
}) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(addStudyPlanEntryAction);
  const formError = useServerFormErrors(state, form);
  const subject = Form.useWatch("subject", form) as string | undefined;
  const availableChapters = chapters.filter(
    (chapter) => chapter.subject === subject && chapter.active,
  );

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
    setIsOpen(false);
  }, [state, form, router]);

  const onFinish = (values: FormValues) => {
    submit({
      studentId,
      dayOfWeek: values.dayOfWeek,
      subject: values.subject,
      hours: values.hours,
      chapterIds: JSON.stringify(values.chapterIds ?? []),
      note: values.note,
    });
  };

  return (
    <StudyPlanEntryFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      submit={onFinish}
      pending={pending}
      formError={formError}
      availableChapters={availableChapters}
      subjectOptions={subjectOptions}
    />
  );
}
