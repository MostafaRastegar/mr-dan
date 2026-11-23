"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import type { ActionState } from "@/utils/app-error";
import { recordStudySessionAction } from "../study.actions";

import { StudySessionFormView } from "./study-session-form.view";

interface StudySessionFormVMProps {
  initialValues?: {
    category?: string;
    durationMinutes?: number;
    subject?: string | null;
    focusLevel?: number | null;
    startedAt?: string;
  };
}

export function StudySessionForm({
  initialValues,
}: StudySessionFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(recordStudySessionAction);
  const formError = useServerFormErrors(state, form);

  const defaults = {
    category: "study",
    durationMinutes: 25,
    subject: "",
    focusLevel: undefined,
    startedAt: "",
    ...initialValues,
  };

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <StudySessionFormView
      form={form}
      state={state as ActionState<unknown> | null}
      submit={submit}
      pending={pending}
      formError={formError}
      initialValues={defaults as Record<string, unknown>}
    />
  );
}
