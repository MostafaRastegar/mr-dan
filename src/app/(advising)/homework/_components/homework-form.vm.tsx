"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import type { ActionState } from "@/utils/app-error";
import type { SubjectOption } from "@/modules/advising/domain/catalog";
import { createHomeworkAction } from "../homework.actions";

import { HomeworkFormView } from "./homework-form.view";

interface HomeworkFormVMProps {
  onClose: () => void;
  subjectOptions: SubjectOption[];
}

export function HomeworkForm({
  onClose,
  subjectOptions,
}: HomeworkFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(createHomeworkAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
  }, [state, form, router]);

  const initialValues = {
    title: "",
    subject: "",
    priority: "low",
    deadline: "",
  };

  return (
    <HomeworkFormView
      form={form}
      state={state as ActionState<unknown> | null}
      submit={submit}
      pending={pending}
      formError={formError}
      onClose={onClose}
      subjectOptions={subjectOptions}
      initialValues={initialValues as Record<string, unknown>}
    />
  );
}
