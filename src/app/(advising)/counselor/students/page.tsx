import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";

import { CounselorRosterWrapper } from "./counselor-roster.vm";

export const metadata = { title: "دانش‌آموزان من — mr-dan" };

export default async function CounselorStudentsPage() {
  const { user } = await requireCapability("group:manage");
  const container = getContainer();
  const [roster, catalog] = await Promise.all([
    container.advising.counselorRoster.execute({
      actor: { id: user.id, role: user.role },
    }),
    container.advising.catalogOptions.execute(),
  ]);

  return (
    <CounselorRosterWrapper
      groups={roster.groups}
      myStudents={roster.myStudents}
      unassigned={roster.unassigned}
      fieldOptions={catalog.fields.map((row) => row.label)}
      gradeOptions={catalog.grades.map((row) => row.label)}
    />
  );
}
