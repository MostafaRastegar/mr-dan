"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";

import { saveStudyPlanHeaderAction } from "../study-plan.actions";
import { StudyPlanHeaderFormView } from "./study-plan-header-form.view";

export function StudyPlanHeaderForm({
  studentId,
  testsTarget,
}: {
  studentId: string;
  testsTarget: number;
}) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(saveStudyPlanHeaderAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const onFinish = (values: FormValues) => {
    submit({ studentId, testsTarget: values.testsTarget });
  };

  return (
    <StudyPlanHeaderFormView
      form={form}
      submit={onFinish}
      pending={pending}
      formError={formError}
      saved={Boolean(state?.ok)}
      initialValues={{ testsTarget }}
    />
  );
}
