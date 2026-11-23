"use client";

import { Form } from "antd";

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
      submit={submit}
      pending={pending}
      formError={formError}
    />
  );
}
