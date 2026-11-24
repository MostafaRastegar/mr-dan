"use client";

import { useState } from "react";
import { Form } from "antd";

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

function emptyOccupied(): number[] {
  return [0, 0, 0, 0, 0, 0, 0];
}

export function StudyProfileForm({ data }: StudyProfileFormVMProps) {
  const [form] = Form.useForm();
  const [savedAt, setSavedAt] = useState<boolean | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [schoolMode, setSchoolMode] = useState<string | null>(data.user.schoolMode ?? null);
  const [needId, setNeedId] = useState<string | null>(data.user.needId ?? null);
  const [takesMockExams, setTakesMockExams] = useState(!!data.user.takesMockExams);
  const [examId, setExamId] = useState<string | null>(data.examResults[0]?.examId ?? null);
  const [taraz, setTaraz] = useState<string | null>(
    data.examResults[0]?.taraz != null ? String(data.examResults[0].taraz) : null,
  );
  const [occupiedHours, setOccupiedHours] = useState<number[]>(
    data.user.otherOccupiedMinutes?.length === 7
      ? data.user.otherOccupiedMinutes.map((m) => Math.round((m ?? 0) / 60))
      : emptyOccupied(),
  );
  const [homeworkAvg, setHomeworkAvg] = useState<string | null>(
    data.user.homeworkAverageMinutes != null ? String(data.user.homeworkAverageMinutes / 60) : null,
  );
  const [courses, setCourses] = useState<{ id: string; title: string; mode: string; weeklyHours?: number }[]>(
    data.courses.map((c) => ({
      id: c.id,
      title: c.title,
      mode: c.mode,
      weeklyHours: c.weeklyMinutes != null ? c.weeklyMinutes / 60 : undefined,
    })),
  );

  const buildProfileFormData = (): FormData => {
    const fd = new FormData();
    fd.set("schoolMode", schoolMode ?? "");
    fd.set("needId", needId ?? "");
    fd.set("takesMockExams", takesMockExams ? "true" : "false");
    fd.set("examId", examId ?? "");
    fd.set("taraz", taraz ?? "");
    for (let i = 0; i < 7; i += 1) fd.set(`otherOccupied${i}`, String(occupiedHours[i] ?? 0));
    fd.set("homeworkAverageHours", homeworkAvg ?? "");
    return fd;
  };

  const handleSubmit = async () => {
    setFormError(null);
    const result = await updateStudyProfileAction(null, buildProfileFormData());
    if (result.ok) {
      setSavedAt(true);
    } else {
      setSavedAt(null);
      setFormError(result.error.message);
    }
  };

  const handleAddCourse = async () => {
    const fd = new FormData();
    const title = form.getFieldValue("courseTitle") as string;
    const mode = (form.getFieldValue("courseMode") as string) ?? "in_person";
    const hours = form.getFieldValue("courseHours");
    fd.set("title", title);
    fd.set("mode", mode);
    if (hours !== undefined && hours !== "") fd.set("weeklyHours", String(hours));
    const result = await addCourseAction(null, fd);
    if (result.ok) {
      form.resetFields(["courseTitle", "courseMode", "courseHours"]);
      setCourses((prev) => [...prev, { id: `new-${Date.now()}`, title, mode, weeklyHours: hours == null ? undefined : Number(hours) }]);
    } else {
      setFormError(result.error.message);
    }
  };

  const handleRemoveCourse = async (id: string) => {
    const result = await deleteCourseAction(id);
    if (result.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } else {
      setFormError(result.error.message);
    }
  };

  return (
    <StudyProfileFormView
      form={form}
      data={data}
      schoolMode={schoolMode}
      needId={needId}
      takesMockExams={takesMockExams}
      examId={examId}
      taraz={taraz}
      occupiedHours={occupiedHours}
      homeworkAvg={homeworkAvg}
      setSchoolMode={setSchoolMode}
      setNeedId={setNeedId}
      setTakesMockExams={setTakesMockExams}
      setExamId={setExamId}
      setTaraz={setTaraz}
      setOccupiedHours={setOccupiedHours}
      setHomeworkAvg={setHomeworkAvg}
      handleAddCourse={handleAddCourse}
      handleRemoveCourse={handleRemoveCourse}
      handleSubmit={handleSubmit}
      savedAt={savedAt}
      formError={formError}
      courses={courses}
    />
  );
}
