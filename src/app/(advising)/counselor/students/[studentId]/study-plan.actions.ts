"use server";

import {
  makeAdvisorSchemas,
  studyPlanHeaderSchema,
} from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import { formValues } from "@/utils/form-data";
import type { ActionState } from "@/utils/app-error";
import { requireSessionUser } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function saveStudyPlanHeaderAction(
  _previous: ActionState<{ studentId: string; testsTarget: number }> | null,
  formData: FormData,
): Promise<ActionState<{ studentId: string; testsTarget: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const input = studyPlanHeaderSchema.parse(formValues(formData));
    const studentId = String(formData.get("studentId") ?? "");
    const plan = await getContainer().advising.saveStudyPlanHeader.execute({
      actor: { id: user.id, role: user.role },
      studentId,
      testsTarget: input.testsTarget,
    });
    return { studentId: plan.studentId, testsTarget: plan.testsTarget };
  });
}

export async function addStudyPlanEntryAction(
  _previous: ActionState<{ id: string; weeklyMinutes: number }> | null,
  formData: FormData,
): Promise<ActionState<{ id: string; weeklyMinutes: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const { subjects } =
      await getContainer().advising.catalogOptions.execute();
    const { studyPlanEntrySchema } = makeAdvisorSchemas(
      subjects.map((row) => row.slug),
    );
    const input = studyPlanEntrySchema.parse(formValues(formData));
    const studentId = String(formData.get("studentId") ?? "");
    const entry = await getContainer().advising.addStudyPlanEntry.execute({
      actor: { id: user.id, role: user.role },
      studentId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes: input.hours * 60,
      testsTarget: input.testsTarget,
      chapterIds: input.chapterIds,
      note: input.note,
    });
    const plan = await getContainer().advising.getStudentStudyPlan.execute({
      actor: { id: user.id, role: user.role },
      studentId,
    });
    const weeklyMinutes = (plan.plan?.entries ?? []).reduce(
      (sum, e) => sum + e.minutes,
      0,
    );
    return { id: entry.id, weeklyMinutes };
  });
}

export async function deleteStudyPlanEntryAction(
  _previous: ActionState<{ weeklyMinutes: number }> | null,
  formData: FormData,
): Promise<ActionState<{ weeklyMinutes: number }>> {
  const { user } = await requireSessionUser();

  return runAction(async () => {
    const studentId = String(formData.get("studentId") ?? "");
    const entryId = String(formData.get("entryId") ?? "");
    await getContainer().advising.deleteStudyPlanEntry.execute({
      actor: { id: user.id, role: user.role },
      studentId,
      entryId,
    });
    const plan = await getContainer().advising.getStudentStudyPlan.execute({
      actor: { id: user.id, role: user.role },
      studentId,
    });
    const weeklyMinutes = (plan.plan?.entries ?? []).reduce(
      (sum, e) => sum + e.minutes,
      0,
    );
    return { weeklyMinutes };
  });
}
