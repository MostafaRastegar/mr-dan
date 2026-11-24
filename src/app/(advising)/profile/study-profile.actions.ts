"use server";

import { redirect } from "next/navigation";

import { studyProfileSchema, examResultSchema, courseSchema } from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function updateStudyProfileAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const values = studyProfileSchema.parse(formValues(formData));
    const actor = { id: session.user.id, role: session.user.role };

    await getContainer().advising.updateStudyProfile.execute({
      actor,
      schoolMode: values.schoolMode ?? undefined,
      needId: values.needId ?? undefined,
      takesMockExams: values.takesMockExams ?? undefined,
      otherOccupiedHours: [
        values.otherOccupied0 ?? 0,
        values.otherOccupied1 ?? 0,
        values.otherOccupied2 ?? 0,
        values.otherOccupied3 ?? 0,
        values.otherOccupied4 ?? 0,
        values.otherOccupied5 ?? 0,
        values.otherOccupied6 ?? 0,
      ],
      homeworkAverageHours: values.homeworkAverageHours ?? undefined,
    });

    // The exam result is submitted together with the profile card.
    const takesMockExams = formData.get("takesMockExams") === "true";
    const examId = String(formData.get("examId") ?? "");
    const taraz = Number(formData.get("taraz"));
    if (takesMockExams && examId && Number.isFinite(taraz)) {
      await getContainer().advising.saveExamResult.execute({
        actor,
        examId,
        taraz,
      });
    }

    return { userId: session.user.id };
  });
}

export async function saveExamResultAction(
  _previous: ActionState<{ examId: string; taraz: number }> | null,
  formData: FormData,
): Promise<ActionState<{ examId: string; taraz: number }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = examResultSchema.parse(formValues(formData));
    const result = await getContainer().advising.saveExamResult.execute({
      actor: { id: session.user.id, role: session.user.role },
      ...input,
    });
    return { examId: result.examId, taraz: result.taraz };
  });
}

export async function addCourseAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = courseSchema.parse(formValues(formData));
    const course = await getContainer().advising.addSupplementaryCourse.execute({
      actor: { id: session.user.id, role: session.user.role },
      title: input.title,
      mode: input.mode,
      weeklyHours: input.weeklyHours,
    });
    return { id: course.id };
  });
}

export async function deleteCourseAction(
  id: string,
): Promise<ActionState<{ id: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    await getContainer().advising.deleteSupplementaryCourse.execute({
      actor: { id: session.user.id, role: session.user.role },
      courseId: id,
    });
    return { id };
  });
}
