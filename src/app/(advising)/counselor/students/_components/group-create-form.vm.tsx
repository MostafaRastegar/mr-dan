"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, Select } from "antd";
import { IconPlus } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";
import { FIELDS, GRADES } from "@/modules/advising/domain/models";
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
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
    />
  );
}
