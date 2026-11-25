"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import type { ProfileView } from "@/modules/advising/domain/models";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";
import {
  useFormAction,
  useServerFormErrors,
} from "@/utils/use-form-action";

import { updateProfileAction } from "../advising.actions";
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
  const router = useRouter();
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

  const { state, submit, pending } = useFormAction(updateProfileAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  return (
    <ProfileFormView
      form={form}
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
      isStudent={isStudent}
      initialValues={initialValues}
      profile={profile}
      studyProfile={studyProfile}
    />
  );
}
