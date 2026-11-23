"use client";

import { useEffect } from "react";
import { Button, Form, Input, Select } from "antd";

import { TEST_IDS } from "@/constants/test-ids";
import { FIELDS, GRADES, type ProfileView } from "@/modules/advising/domain/models";
import { useFormAction, useServerFormErrors, type FormValues } from "@/utils/use-form-action";
import type { ActionState } from "@/utils/app-error";
import { updateProfileAction } from "../advising.actions";

import { ProfileFormView } from "./profile-form.view";

export function ProfileFormWrapper({ profile }: { profile: ProfileView }) {
  const [form] = Form.useForm();
  const { state, submit, pending } = useFormAction(updateProfileAction);
  const formError = useServerFormErrors(state, form);
  const isStudent = profile.role === "student";

  const initialValues = {
    fullName: profile.fullName,
    email: profile.email ?? undefined,
    grade: profile.grade ?? undefined,
    fieldOfStudy: profile.fieldOfStudy ?? undefined,
    schoolName: profile.schoolName ?? undefined,
  };

  useEffect(() => {
    if (!state?.ok) return;
    form.setFieldsValue({ currentPassword: undefined, newPassword: undefined });
  }, [state, form]);

  return (
    <ProfileFormView
      form={form}
      state={state as ActionState<unknown> | null}
      submit={submit}
      pending={pending}
      formError={formError}
      isStudent={isStudent}
      initialValues={initialValues}
      profile={profile}
    />
  );
}
