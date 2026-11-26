"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { durationToMinutes } from "@/modules/advising/presentation/time-value";
import {
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";
import type { PlanCandidate } from "@/modules/advising/application/free-time";

import { planHomeworkAction } from "../budget.actions";

import { PlanFormView } from "./plan-form.view";

interface PlanFormProps {
  dayKey: string;
  candidates: PlanCandidate[];
}

export function PlanForm({ dayKey, candidates }: PlanFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(planHomeworkAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
    setIsOpen(false);
  }, [state, form, router]);

  const onFinish = (values: FormValues) => {
    const minutes = durationToMinutes(values.plannedTime);
    const plannedTime =
      minutes === null
        ? ""
        : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
            minutes % 60,
          ).padStart(2, "0")}`;
    submit({ date: dayKey, homeworkId: values.homeworkId, plannedTime });
  };

  return (
    <PlanFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      state={state}
      submit={onFinish}
      pending={pending}
      formError={formError}
      candidates={candidates}
    />
  );
}
