"use client";

import { Button, Form, Input } from "antd";

import { TEST_IDS } from "@/constants/test-ids";
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { loginAction } from "../auth.actions";

import { LoginFormView } from "./login-form.view";

export function LoginFormWrapper() {
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(loginAction);
  const formError = useServerFormErrors(state, form);

  return (
    <LoginFormView
      form={form}
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
    />
  );
}
