"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";
import type { Chapter } from "@/modules/advising/domain/models";

import { addStudyPlanEntryAction } from "../study-plan.actions";
import { StudyPlanEntryFormView } from "./study-plan-entry-form.view";

export function StudyPlanEntryForm({
  studentId,
  chapters,
}: {
  studentId: string;
  chapters: Chapter[];
}) {
  const [form] = Form.useForm();
  const router = useRouter();
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
      form={form}
      submit={onFinish}
      pending={pending}
      formError={formError}
      saved={Boolean(state?.ok)}
      availableChapters={availableChapters}
    />
  );
}
