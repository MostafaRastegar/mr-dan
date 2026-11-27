import { redirect, notFound } from "next/navigation";
import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import { ForbiddenError, NotFoundError } from "@/modules/advising/domain/errors";
import { CounselorStudentWrapper } from "./counselor-student.vm";
import { readStudentDetail } from "./student-detail.read";

export default async function CounselorStudentPage({
  params,
}: Readonly<{ params: Promise<{ studentId: string }> }>) {
  const { studentId } = await params;
  if (!studentId) notFound();
  const session = await requireCapability("group:manage");
  const container = getContainer();
  const [chapters, catalog] = await Promise.all([
    container.advising.listChapters(),
    container.advising.catalogOptions.execute(),
  ]);
  const detail = await readStudentDetail(
    { id: session.user.id, role: session.user.role },
    studentId,
  ).catch((err: unknown) => {
    if (err instanceof ForbiddenError) redirect("/profile");
    if (err instanceof NotFoundError) notFound();
    throw err;
  });
  return (
    <CounselorStudentWrapper
      studentId={studentId}
      view={detail.view}
      canWrite={detail.canWrite}
      supervision={detail.supervision}
      chapters={chapters}
      subjects={catalog.subjects}
      labels={catalog.subjectLabels}
    />
  );
}
