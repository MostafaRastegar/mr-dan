"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {
  useActionMutation,
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";

import {
  addSchoolProgramEntryAction,
  deleteSchoolProgramEntryAction,
} from "../school-program.actions";
import { SchoolProgramFormView } from "./school-program-form.view";
import type { SchoolProgramEntry } from "./school-program-form.view";

interface SchoolProgramFormVMProps {
  initialEntries: SchoolProgramEntry[];
  fieldOfStudy: string | null;
}

export function SchoolProgramForm({
  initialEntries,
  fieldOfStudy,
}: SchoolProgramFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();

  const {
    state: addState,
    submit,
    pending: addPending,
  } = useFormAction(addSchoolProgramEntryAction);
  const formError = useServerFormErrors(addState, form);

  const {
    state: deleteState,
    run: deleteEntry,
    pending: deletePending,
  } = useActionMutation(deleteSchoolProgramEntryAction);

  useEffect(() => {
    if (!addState?.ok) return;
    form.resetFields();
    router.refresh();
  }, [addState, form, router]);

  useEffect(() => {
    if (!deleteState?.ok) return;
    router.refresh();
  }, [deleteState, router]);

  const onFinish = (values: FormValues) => {
    submit(values);
  };

  return (
    <SchoolProgramFormView
      form={form}
      entries={initialEntries}
      fieldOfStudy={fieldOfStudy}
      saved={Boolean(addState?.ok || deleteState?.ok)}
      formError={formError}
      pending={addPending || deletePending}
      submit={onFinish}
      handleDelete={(id) => deleteEntry({ id })}
    />
  );
}
