"use client";

import { useEffect, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(saveStudyPlanHeaderAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    setIsOpen(false);
  }, [state, router]);

  const onFinish = (values: FormValues) => {
    submit({ studentId, testsTarget: values.testsTarget });
  };

  return (
    <StudyPlanHeaderFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      submit={onFinish}
      pending={pending}
      formError={formError}
      initialValues={{ testsTarget }}
    />
  );
}
