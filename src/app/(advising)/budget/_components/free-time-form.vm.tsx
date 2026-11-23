"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { durationToMinutes } from "@/modules/advising/presentation/time-value";
import {
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";

import { setFreeTimeAction } from "../budget.actions";

import { FreeTimeFormView } from "./free-time-form.view";

interface FreeTimeFormProps {
  dayKey: string;
  freeMinutes: number | null;
  suggestedMinutes: number;
}

export function FreeTimeForm({ dayKey, freeMinutes, suggestedMinutes }: FreeTimeFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(setFreeTimeAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const onFinish = (values: FormValues) => {
    const minutes = durationToMinutes(values.freeTime);
    // An empty picker means "use the suggestion"; `""` is how that is said on the wire.
    const freeTime =
      minutes === null
        ? ""
        : `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
            minutes % 60,
          ).padStart(2, "0")}`;
    submit({ date: dayKey, freeTime });
  };

  return (
    <FreeTimeFormView
      form={form}
      state={state}
      submit={onFinish}
      pending={pending}
      formError={formError}
      freeMinutes={freeMinutes}
      suggestedMinutes={suggestedMinutes}
    />
  );
}
