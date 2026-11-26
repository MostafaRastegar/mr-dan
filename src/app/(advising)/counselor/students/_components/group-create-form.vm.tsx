"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { createGroupAction } from "../students.actions";

import { GroupCreateFormView } from "./group-create-form.view";

export function GroupCreateFormWrapper({
  fieldOptions,
  gradeOptions,
}: {
  fieldOptions: string[];
  gradeOptions: string[];
}) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isOpen, setIsOpen] = useState(false);
  const { state, submit, pending } = useFormAction(createGroupAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
    setIsOpen(false);
  }, [state, form, router]);

  return (
    <GroupCreateFormView
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      form={form}
      submit={submit}
      pending={pending}
      formError={formError}
      fieldOptions={fieldOptions}
      gradeOptions={gradeOptions}
    />
  );
}
