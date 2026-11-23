"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { assignStudentAction } from "../students.actions";

import { AssignStudentFormView } from "./assign-student-form.view";

export function AssignStudentFormWrapper({
  groups,
  students,
}: {
  groups: GroupSummary[];
  students: StudentSummary[];
}) {
  const router = useRouter();
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(assignStudentAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields(["studentId"]);
    router.refresh();
  }, [state, form, router]);

  return (
    <AssignStudentFormView
      form={form}
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
      groups={groups}
      students={students}
    />
  );
}
