import { CounselorStudentWrapper } from "./counselor-student.vm";
import { redirect, notFound } from "next/navigation";
import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import { ForbiddenError, NotFoundError } from "@/modules/advising/domain/errors";
import type { StudentStudyPlanView } from "@/modules/advising/application/study-plan";

export default async function CounselorStudentPage({
  params,
}: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  if (!studentId) notFound();
  const session = await requireCapability("group:manage");
  const container = getContainer();
  let view: StudentStudyPlanView;
  try {
    view = await container.advising.getStudentStudyPlan.execute({
      actor: { id: session.user.id, role: session.user.role },
      studentId,
    });
  } catch (err) {
    if (err instanceof ForbiddenError) redirect("/profile");
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
  const [chapters, catalog] = await Promise.all([
    container.advising.listChapters(),
    container.advising.catalogOptions.execute(),
  ]);
  return (
    <CounselorStudentWrapper
      studentId={studentId}
      view={view}
      chapters={chapters}
      subjects={catalog.subjects}
      labels={catalog.subjectLabels}
    />
  );
}
