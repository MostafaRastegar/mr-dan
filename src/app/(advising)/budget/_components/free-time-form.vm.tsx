"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

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

function minutesToHHMM(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function FreeTimeForm({ dayKey, freeMinutes, suggestedMinutes }: FreeTimeFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(setFreeTimeAction);
  const formError = useServerFormErrors(state, form);
  const initialValues = { freeTime: minutesToHHMM(freeMinutes) };

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    setIsOpen(false);
  }, [state, router]);

  const onFinish = (values: FormValues) => {
    // An empty input means "use the suggestion"; `""` is how that is said on the wire.
    submit({ date: dayKey, freeTime: values.freeTime ?? "" });
  };

  return (
    <FreeTimeFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      submit={onFinish}
      pending={pending}
      formError={formError}
      freeMinutes={freeMinutes}
      suggestedMinutes={suggestedMinutes}
      initialValues={initialValues}
    />
  );
}
