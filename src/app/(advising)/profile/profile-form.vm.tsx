"use client";

import { useState } from "react";
import { Form } from "antd";

import type { ProfileView } from "@/modules/advising/domain/models";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";

import { ProfileFormView } from "./profile-form.view";

function minutesToHHMM(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function ProfileFormWrapper({
  profile,
  studyProfile,
}: {
  profile: ProfileView;
  studyProfile: StudyProfileView;
}) {
  const [form] = Form.useForm();
  const [savedAt, setSavedAt] = useState<boolean | null>(null);
  const isStudent = profile.role === "student";

  const initialValues = {
    fullName: profile.fullName,
    email: profile.email ?? undefined,
    grade: profile.grade ?? undefined,
    fieldOfStudy: profile.fieldOfStudy ?? undefined,
    schoolName: profile.schoolName ?? undefined,
    sleepTime: minutesToHHMM(profile.sleepMinutes),
    wakeTime: minutesToHHMM(profile.wakeMinutes),
  };

  // UI stage: intercept submit, show local "ذخیره شد", no network write.
  // Stage Backend restores the real `updateProfileAction` via `useFormAction`.
  const handleSubmit = (_values: FormValues) => {
    setSavedAt(true);
  };

  return (
    <ProfileFormView
      form={form}
      state={null as ActionState<unknown> | null}
      submit={handleSubmit}
      pending={false}
      formError={null}
      isStudent={isStudent}
      initialValues={initialValues}
      profile={profile}
      savedAt={savedAt}
      studyProfile={studyProfile}
    />
  );
}
