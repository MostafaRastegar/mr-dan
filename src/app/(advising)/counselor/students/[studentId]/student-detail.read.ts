import { getContainer } from "@/server/container";
import type { Actor } from "@/modules/advising/application/planning-access";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { iranDayKey } from "@/modules/advising/domain/day-key";
import type { SupervisionSections } from "./_components/supervision-sections.view";

export interface StudentDetailData {
  view: StudentStudyPlanView;
  canWrite: boolean;
  supervision: SupervisionSections | null;
}

/**
 * Student-detail read for the shared counselor/supervision surface.
 *
 * `GetStudentStudyPlanUseCase` authorizes counselor-of-record (writable) or a
 * `supervise:read` holder (read-only). Supervision then fills the read-only
 * homework/nutrition/budget sections through the same read use cases.
 */
export async function readStudentDetail(
  actor: Actor,
  studentId: string,
): Promise<StudentDetailData> {
  const container = getContainer();
  const view = await container.advising.getStudentStudyPlan.execute({
    actor,
    studentId,
  });

  if (!hasCapability(actor.role, "supervise:read")) {
    return { view, canWrite: view.canWrite, supervision: null };
  }

  const dayKey = iranDayKey(new Date());
  const [homework, nutrition, budget] = await Promise.all([
    container.advising.listHomework.execute({ actor, studentId }),
    container.advising.getNutritionOverview.execute({ actor, studentId }),
    container.advising.getDayBudget.execute({ actor, studentId, dayKey }),
  ]);

  return {
    view,
    canWrite: view.canWrite,
    supervision: { homework: homework.items, nutrition, budget },
  };
}
