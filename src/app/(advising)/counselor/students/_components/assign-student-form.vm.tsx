"use client";

import { useEffect, useState } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(assignStudentAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields(["studentId"]);
    router.refresh();
    setIsOpen(false);
  }, [state, form, router]);

  return (
    <AssignStudentFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      submit={submit}
      pending={pending}
      formError={formError}
      groups={groups}
      students={students}
    />
  );
}
