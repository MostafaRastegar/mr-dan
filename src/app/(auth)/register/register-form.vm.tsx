"use client";

import { Button, Form, Input, Select } from "antd";
import Link from "next/link";

import { TEST_IDS } from "@/constants/test-ids";
import { FIELDS, GRADES } from "@/modules/advising/domain/models";
import { useFormAction, useServerFormErrors, type FormValues } from "@/utils/use-form-action";
import type { ActionState } from "@/utils/app-error";
import { registerAction } from "../auth.actions";

import { RegisterFormView } from "./register-form.view";

const ROLE_OPTIONS = [
  { value: "student", label: "دانش‌آموز" },
  { value: "counselor", label: "مشاور" },
];

const REGISTER_INITIAL_VALUES = { role: "student" };

export function RegisterFormWrapper() {
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(registerAction);
  const formError = useServerFormErrors(state, form);
  const role = Form.useWatch("role", form);
  const isStudent = role !== "counselor";

  return (
    <RegisterFormView
      form={form}
      state={state as ActionState<unknown> | null}
      submit={submit}
      pending={pending}
      formError={formError}
      role={role}
      isStudent={isStudent}
      initialValues={REGISTER_INITIAL_VALUES}
    />
  );
}
