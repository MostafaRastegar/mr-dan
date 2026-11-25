"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
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

function occupiedMinutesToHoursString(
  minutes: number | null | undefined,
): string | undefined {
  if (minutes == null) return undefined;
  return String(Math.round(minutes / 60));
}

export function StudyProfileForm({ data }: StudyProfileFormVMProps) {
  const [form] = Form.useForm();
  const router = useRouter();

  const initialValues = {
    schoolMode: data.user.schoolMode ?? undefined,
    needId: data.user.needId ?? undefined,
    takesMockExams: data.user.takesMockExams ? "true" : undefined,
    otherOccupied0: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[0]),
    otherOccupied1: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[1]),
    otherOccupied2: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[2]),
    otherOccupied3: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[3]),
    otherOccupied4: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[4]),
    otherOccupied5: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[5]),
    otherOccupied6: occupiedMinutesToHoursString(data.user.otherOccupiedMinutes?.[6]),
    homeworkAverageHours: data.user.homeworkAverageMinutes != null
      ? String(data.user.homeworkAverageMinutes / 60)
      : undefined,
    examId: data.examResults[0]?.examId ?? undefined,
    taraz: data.examResults[0]?.taraz != null ? String(data.examResults[0].taraz) : undefined,
    courseTitle: undefined,
    courseMode: undefined,
    courseHours: undefined,
  };

  const { state, submit, pending } = useFormAction(updateStudyProfileAction);
  const formError = useServerFormErrors(state, form);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [takesMockExams, setTakesMockExams] = useState(
    data.user.takesMockExams ?? false,
  );

  const toggleTakesMockExams = (checked: boolean) => {
    setTakesMockExams(checked);
  };

  const handleSubmit = (values: Record<string, unknown>) => {
    submit({ ...values, takesMockExams: takesMockExams ? "true" : undefined });
  };

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  const handleAddCourse = async () => {
    const title = form.getFieldValue("courseTitle") as string;
    const mode = form.getFieldValue("courseMode") as string;
    const hours = form.getFieldValue("courseHours") as number | undefined;

    const fd = new FormData();
    fd.set("title", title);
    fd.set("mode", mode);
    if (hours !== undefined && hours !== null) {
      fd.set("weeklyHours", String(hours));
    }

    const result = await addCourseAction(null, fd);
    if (result.ok) {
      form.resetFields(["courseTitle", "courseMode", "courseHours"]);
      setCourseError(null);
      router.refresh();
    } else {
      setCourseError(result.error.message);
    }
  };

  const handleRemoveCourse = async (id: string) => {
    const result = await deleteCourseAction(id);
    if (result.ok) {
      setCourseError(null);
      router.refresh();
    } else {
      setCourseError(result.error.message);
    }
  };

  return (
    <StudyProfileFormView
      form={form}
      data={data}
      submit={submit}
      pending={pending}
      formError={formError ?? courseError}
      initialValues={initialValues as Record<string, unknown>}
      takesMockExams={takesMockExams}
      toggleTakesMockExams={toggleTakesMockExams}
      handleSubmit={handleSubmit}
      handleAddCourse={handleAddCourse}
      handleRemoveCourse={handleRemoveCourse}
    />
  );
}
