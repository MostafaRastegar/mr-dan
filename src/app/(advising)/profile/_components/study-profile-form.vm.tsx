"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import {
  useActionMutation,
  useFormAction,
  useServerFormErrors,
} from "@/utils/use-form-action";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";

import {
  updateStudyProfileAction,
  addCourseAction,
  deleteCourseAction,
} from "../study-profile.actions";
import { StudyProfileFormView } from "./study-profile-form.view";

interface StudyProfileFormVMProps {
  data: StudyProfileView;
}

function hoursOfDay(
  minutes: number | null | undefined,
): number | undefined {
  return minutes == null ? undefined : minutes / 60;
}

export function StudyProfileForm({ data }: StudyProfileFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();

  const initialValues = {
    schoolMode: data.user.schoolMode ?? undefined,
    needId: data.user.needId ?? undefined,
    takesMockExams: data.user.takesMockExams ?? false,
    otherOccupied0: hoursOfDay(data.user.otherOccupiedMinutes?.[0]),
    otherOccupied1: hoursOfDay(data.user.otherOccupiedMinutes?.[1]),
    otherOccupied2: hoursOfDay(data.user.otherOccupiedMinutes?.[2]),
    otherOccupied3: hoursOfDay(data.user.otherOccupiedMinutes?.[3]),
    otherOccupied4: hoursOfDay(data.user.otherOccupiedMinutes?.[4]),
    otherOccupied5: hoursOfDay(data.user.otherOccupiedMinutes?.[5]),
    otherOccupied6: hoursOfDay(data.user.otherOccupiedMinutes?.[6]),
    homeworkAverageHours: hoursOfDay(data.user.homeworkAverageMinutes),
    examId: data.examResults[0]?.examId ?? undefined,
    taraz: data.examResults[0]?.taraz ?? undefined,
    courseTitle: undefined,
    courseMode: undefined,
    courseHours: undefined,
  };

  const { state, submit, pending } = useFormAction(updateStudyProfileAction);
  const formError = useServerFormErrors(state, form);

  const {
    state: courseState,
    submit: submitCourse,
    pending: coursePending,
  } = useFormAction(addCourseAction);
  const courseError =
    courseState && !courseState.ok ? courseState.error.message : null;

  const { state: deleteState, run: deleteCourse, pending: deletePending } =
    useActionMutation(deleteCourseAction);
  const deleteError =
    deleteState && !deleteState.ok ? deleteState.error.message : null;

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  useEffect(() => {
    if (!courseState?.ok) return;
    form.resetFields(["courseTitle", "courseMode", "courseHours"]);
    router.refresh();
  }, [courseState, form, router]);

  useEffect(() => {
    if (!deleteState?.ok) return;
    router.refresh();
  }, [deleteState, router]);

  const handleAddCourse = () => {
    submitCourse({
      title: form.getFieldValue("courseTitle"),
      mode: form.getFieldValue("courseMode"),
      weeklyHours: form.getFieldValue("courseHours"),
    });
  };

  const handleRemoveCourse = (id: string) => {
    deleteCourse({ id });
  };

  return (
    <StudyProfileFormView
      form={form}
      data={data}
      submit={submit}
      pending={pending}
      coursePending={coursePending}
      deletePending={deletePending}
      formError={formError ?? courseError ?? deleteError}
      initialValues={initialValues as Record<string, unknown>}
      saved={Boolean(state?.ok)}
      handleAddCourse={handleAddCourse}
      handleRemoveCourse={handleRemoveCourse}
    />
  );
}
