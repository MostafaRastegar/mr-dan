"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import type { SubjectRow } from "@/modules/advising/domain/models";
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
  subjects: SubjectRow[];
  labels: Record<string, string>;
}

export function SchoolProgramForm({
  initialEntries,
  fieldOfStudy,
  subjects,
  labels,
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
      subjects={subjects}
      labels={labels}
      saved={Boolean(addState?.ok || deleteState?.ok)}
      formError={formError}
      pending={addPending || deletePending}
      submit={onFinish}
      handleDelete={(id) => deleteEntry({ id })}
    />
  );
}
