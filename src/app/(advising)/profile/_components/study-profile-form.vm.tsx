"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import { useFormAction } from "@/utils/use-form-action";
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
  console.log("[StudyProfileForm] data:", JSON.stringify({
    userId: data.user.id,
    schoolMode: data.user.schoolMode,
    needId: data.user.needId,
    takesMockExams: data.user.takesMockExams,
    otherOccupiedMinutes: data.user.otherOccupiedMinutes,
    homeworkAverageMinutes: data.user.homeworkAverageMinutes,
    needsCount: data.needs.length,
    examsCount: data.exams.length,
    resultsCount: data.examResults.length,
    coursesCount: data.courses.length,
  }, null, 2));

  const [form] = Form.useForm();
  const router = useRouter();
  const { state, submit } = useFormAction(updateStudyProfileAction);
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
  const [courseMode, setCourseMode] = useState<string | null>("in_person");
  const [courseHours, setCourseHours] = useState<number | null>(null);
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

  const handleSubmit = (values: Record<string, unknown>) => {
    setFormError(null);
    // hoursInput overrides InputNumber value/onChange, so antd Form never
    // sees occupiedHours / homeworkAverageHours / takesMockExams. Inject them
    // manually so the action receives what the user actually entered.
    const allValues = {
      ...values,
      schoolMode,
      needId,
      otherOccupied0: occupiedHours[0] ?? undefined,
      otherOccupied1: occupiedHours[1] ?? undefined,
      otherOccupied2: occupiedHours[2] ?? undefined,
      otherOccupied3: occupiedHours[3] ?? undefined,
      otherOccupied4: occupiedHours[4] ?? undefined,
      otherOccupied5: occupiedHours[5] ?? undefined,
      otherOccupied6: occupiedHours[6] ?? undefined,
      homeworkAverageHours: homeworkAvg != null ? Number(homeworkAvg) : undefined,
      takesMockExams: takesMockExams,
    };
    submit(allValues);
  };

  // After a successful save, refresh so the server re-renders with fresh DB data.
  useEffect(() => {
    if (!state?.ok) return;
    setSavedAt(true);
    router.refresh();
  }, [state, router]);

  const handleAddCourse = async () => {
    const fd = new FormData();
    const title = form.getFieldValue("courseTitle") as string;
    fd.set("title", title);
    fd.set("mode", courseMode ?? "in_person");
    if (courseHours !== undefined && courseHours !== null) {
      fd.set("weeklyHours", String(courseHours));
    }
    const result = await addCourseAction(null, fd);
    if (result.ok) {
      form.resetFields(["courseTitle", "courseMode", "courseHours"]);
      setCourses((prev) => [
        ...prev,
        {
          id: `new-${Date.now()}`,
          title,
          mode: courseMode ?? "in_person",
          weeklyHours: courseHours == null ? undefined : courseHours,
        },
      ]);
      router.refresh();
    } else {
      setFormError(result.error.message);
    }
  };

  const handleRemoveCourse = async (id: string) => {
    const result = await deleteCourseAction(id);
    if (result.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
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
      courseMode={courseMode}
      setCourseMode={setCourseMode}
      courseHours={courseHours}
      setCourseHours={setCourseHours}
      handleAddCourse={handleAddCourse}
      handleRemoveCourse={handleRemoveCourse}
      handleSubmit={handleSubmit}
      savedAt={savedAt}
      formError={formError}
      courses={courses}
    />
  );
}
