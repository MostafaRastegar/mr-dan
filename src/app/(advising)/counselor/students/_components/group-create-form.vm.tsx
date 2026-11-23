"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { createGroupAction } from "../students.actions";

import { GroupCreateFormView } from "./group-create-form.view";

export function GroupCreateFormWrapper() {
  const router = useRouter();
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(createGroupAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    form.resetFields();
    router.refresh();
  }, [state, form, router]);

  return (
    <GroupCreateFormView
      form={form}
      submit={submit}
      pending={pending}
      formError={formError}
    />
  );
}
