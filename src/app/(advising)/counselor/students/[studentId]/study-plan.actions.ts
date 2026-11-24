"use server";

import { redirect } from "next/navigation";

import { studyPlanHeaderSchema, studyPlanEntrySchema } from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

function formValues(formData: FormData): Record<string, FormDataEntryValue> {
  return Object.fromEntries(formData);
}

export async function saveStudyPlanHeaderAction(
  _previous: ActionState<{ studentId: string; testsTarget: number }> | null,
  formData: FormData,
): Promise<ActionState<{ studentId: string; testsTarget: number }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = studyPlanHeaderSchema.parse(formValues(formData));
    const studentId = String(formData.get("studentId") ?? "");
    const plan = await getContainer().advising.saveStudyPlanHeader.execute({
      actor: { id: session.user.id, role: session.user.role },
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
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const input = studyPlanEntrySchema.parse(formValues(formData));
    const studentId = String(formData.get("studentId") ?? "");
    const entry = await getContainer().advising.addStudyPlanEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      studentId,
      dayOfWeek: input.dayOfWeek,
      subject: input.subject,
      minutes: input.hours * 60,
      chapterIds: input.chapterIds,
      note: input.note,
    });
    const plan = await getContainer().advising.getStudentStudyPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
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
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const studentId = String(formData.get("studentId") ?? "");
    const entryId = String(formData.get("entryId") ?? "");
    await getContainer().advising.deleteStudyPlanEntry.execute({
      actor: { id: session.user.id, role: session.user.role },
      studentId,
      entryId,
    });
    const plan = await getContainer().advising.getStudentStudyPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
      studentId,
    });
    const weeklyMinutes = (plan.plan?.entries ?? []).reduce(
      (sum, e) => sum + e.minutes,
      0,
    );
    return { weeklyMinutes };
  });
}
