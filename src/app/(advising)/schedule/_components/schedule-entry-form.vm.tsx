"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import type { ActionState } from "@/utils/app-error";
import type { SubjectRow } from "@/modules/advising/domain/models";
import { createScheduleEntryAction } from "../schedule.actions";

import { ScheduleEntryFormView } from "./schedule-entry-form.view";

interface ScheduleEntryFormVMProps {
  open: boolean;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  onClose: () => void;
}

export function ScheduleEntryForm({
  open,
  fieldOfStudy,
  subjects,
  onClose,
}: ScheduleEntryFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(createScheduleEntryAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
    onClose();
  }, [state, form, router, onClose]);

  const initialValues = {
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    subject: "",
    teacher: undefined,
    room: undefined,
  };

  return (
    <ScheduleEntryFormView
      open={open}
      form={form}
      state={state as ActionState<unknown> | null}
      submit={submit}
      pending={pending}
      formError={formError}
      onClose={onClose}
      fieldOfStudy={fieldOfStudy}
      subjects={subjects}
      initialValues={initialValues as Record<string, unknown>}
    />
  );
}
