import CounselorRoster from "@/components/advising/counselor-roster";
import { getContainer } from "@/server/container";
import { requireCounselor } from "@/server/advising-guards";

export const metadata = { title: "دانش‌آموزان من — mr-dan" };

export default async function CounselorStudentsPage() {
  const { user } = await requireCounselor();
  const roster = await getContainer().advising.counselorRoster.execute({
    actor: { id: user.id, role: user.role },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">دانش‌آموزان من</h1>
      <CounselorRoster groups={roster.groups} students={roster.students} />
    </div>
  );
}
