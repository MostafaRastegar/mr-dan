import { CounselorStudentWrapper } from "./counselor-student.vm";
import { redirect, notFound } from "next/navigation";

import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import { ForbiddenError, NotFoundError } from "@/modules/advising/domain/errors";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";

export default async function CounselorStudentPage({
  params,
}: Readonly<{ params: { studentId: string } }>) {
  const session = await requireCapability("group:manage");

  let view: StudentStudyPlanView;
  try {
    view = await getContainer().advising.getStudentStudyPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
      studentId: params.studentId,
    });
  } catch (err) {
    if (err instanceof ForbiddenError) redirect("/profile");
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

  const chapters = await getContainer().advising.listChapters();

  return <CounselorStudentWrapper studentId={params.studentId} view={view} chapters={chapters} />;
}
