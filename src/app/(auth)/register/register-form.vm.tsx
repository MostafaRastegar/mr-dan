"use client";

import { Form } from "antd";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { registerAction } from "../auth.actions";

import { RegisterFormView } from "./register-form.view";

const REGISTER_INITIAL_VALUES = { role: "student" };

export function RegisterFormWrapper({
  fieldOptions,
  gradeOptions,
}: {
  fieldOptions: string[];
  gradeOptions: string[];
}) {
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(registerAction);
  const formError = useServerFormErrors(state, form);
  const role = Form.useWatch("role", form);
  const isStudent = role !== "counselor";

  return (
    <RegisterFormView
      form={form}
      submit={submit}
      pending={pending}
      formError={formError}
      isStudent={isStudent}
      initialValues={REGISTER_INITIAL_VALUES}
      fieldOptions={fieldOptions}
      gradeOptions={gradeOptions}
    />
  );
}
