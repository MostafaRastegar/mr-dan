"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import type { PhysicalProfile } from "@/modules/advising/domain/models";
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { updatePhysicalProfileAction } from "../nutrition.actions";

import { PhysicalFormView } from "./physical-form.view";

interface PhysicalFormProps {
  profile: PhysicalProfile;
}

export function PhysicalForm({ profile }: PhysicalFormProps) {
  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit, pending } = useFormAction(updatePhysicalProfileAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const initialValues = {
    age: profile.age ?? undefined,
    gender: profile.gender ?? undefined,
    heightCm: profile.heightCm ?? undefined,
    weightKg: profile.weightKg ?? undefined,
    activityLevel: profile.activityLevel ?? undefined,
    dietGoal: profile.dietGoal ?? undefined,
  };

  return (
    <PhysicalFormView
      form={form}
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
      initialValues={initialValues}
    />
  );
}
