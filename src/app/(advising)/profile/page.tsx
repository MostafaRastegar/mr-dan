import { redirect } from "next/navigation";

import ProfileForm from "@/components/advising/profile-form";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";

export const metadata = { title: "پروفایل — mr-dan" };

export default async function ProfilePage() {
  const { user } = await requireSessionUser();
  const profile = await getContainer().advising.getProfile.execute({
    userId: user.id,
  });
  if (!profile) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">پروفایل</h1>
        <p className="text-sm text-slate-600" dir="ltr">
          {profile.username}
        </p>
      </div>

      {profile.role === "student" ? (
        <dl className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">گروه</dt>
            <dd>{profile.groupName ?? "بدون گروه"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">مشاور</dt>
            <dd>{profile.counselorName ?? "تعیین نشده"}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-slate-600">نقش شما: مشاور</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
