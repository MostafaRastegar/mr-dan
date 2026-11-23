import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";

import { CounselorRosterWrapper } from "./counselor-roster.vm";

export const metadata = { title: "دانش‌آموزان من — mr-dan" };

export default async function CounselorStudentsPage() {
  const { user } = await requireCapability("group:manage");
  const roster = await getContainer().advising.counselorRoster.execute({
    actor: { id: user.id, role: user.role },
  });

  return <CounselorRosterWrapper groups={roster.groups} students={roster.students} />;
}
