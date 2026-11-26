import { ProfileFormWrapper } from "./profile-form.vm";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";
import { redirect } from "next/navigation";

export const metadata = { title: "پروفایل — mr-dan" };

export default async function ProfilePage() {
  const { user } = await requireSessionUser();
  const actor = { id: user.id, role: user.role };
  const [profile, studyProfile, catalog] = await Promise.all([
    getContainer().advising.getProfile.execute({ userId: user.id }),
    getContainer().advising.getStudyProfile.execute({ actor }),
    getContainer().advising.catalogOptions.execute(),
  ]);
  if (!profile) redirect("/login");

  return (
    <ProfileFormWrapper
      profile={profile}
      studyProfile={studyProfile}
      fieldOptions={catalog.fields.map((row) => row.label)}
      gradeOptions={catalog.grades.map((row) => row.label)}
    />
  );
}
