"use server";

import {
  studyProfileSchema,
  examResultSchema,
  courseSchema,
} from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function updateStudyProfileAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const values = studyProfileSchema.parse(formValues(formData));
    const actor = { id: user.id, role: user.role };
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
    const examId = String(formData.get("examId") ?? "").trim();
    const taraz = String(formData.get("taraz") ?? "").trim();
    if (takesMockExams && examId && taraz) {
      const input = examResultSchema.parse({ examId, taraz });
      await getContainer().advising.saveExamResult.execute({
        actor,
        examId: input.examId,
        taraz: input.taraz,
      });
    }

    return { userId: user.id };
  });
}

export async function saveExamResultAction(
  _previous: ActionState<{ examId: string; taraz: number }> | null,
  formData: FormData,
): Promise<ActionState<{ examId: string; taraz: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const input = examResultSchema.parse(formValues(formData));
    const result = await getContainer().advising.saveExamResult.execute({
      actor: { id: user.id, role: user.role },
      ...input,
    });
    return { examId: result.examId, taraz: result.taraz };
  });
}

export async function addCourseAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const input = courseSchema.parse(formValues(formData));
    const course = await getContainer().advising.addSupplementaryCourse.execute(
      {
        actor: { id: user.id, role: user.role },
        title: input.title,
        mode: input.mode,
        weeklyHours: input.weeklyHours,
      },
    );
    return { id: course.id };
  });
}

export async function deleteCourseAction(
  _previous: ActionState<{ id: string }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const id = String(formData.get("id") ?? "");
    await getContainer().advising.deleteSupplementaryCourse.execute({
      actor: { id: user.id, role: user.role },
      courseId: id,
    });
    return { id };
  });
}
