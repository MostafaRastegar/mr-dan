import { redirect } from "next/navigation";

import { ProfileFormWrapper } from "./profile-form.vm";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";

export const metadata = { title: "پروفایل — mr-dan" };

export default async function ProfilePage() {
  const { user } = await requireSessionUser();
  const profile = await getContainer().advising.getProfile.execute({
    userId: user.id,
  });
  if (!profile) redirect("/login");

  return <ProfileFormWrapper profile={profile} />;
}
