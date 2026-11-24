import { CounselorStudentWrapper } from "./counselor-student.vm";
import { EMPTY_COUNSELOR_STUDENT, COUNSELOR_STUDENT_FIXTURE } from "./counselor-student.fixture";
import { requireCapability } from "@/server/advising-guards";

type Demo = "success" | "empty" | "loading" | "error";

export default async function CounselorStudentPage({
  searchParams,
}: Readonly<{
  searchParams: { demo?: string };
  params: { studentId: string };
}>) {
  await requireCapability("group:manage");

  const demo = (searchParams.demo ?? "success") as Demo;
  const data = demo === "empty" ? EMPTY_COUNSELOR_STUDENT : COUNSELOR_STUDENT_FIXTURE;

  return <CounselorStudentWrapper data={data} demo={demo} />;
}
