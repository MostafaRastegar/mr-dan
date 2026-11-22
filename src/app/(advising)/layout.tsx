import Link from "next/link";
import { IconLogout, IconUser, IconUsers } from "@tabler/icons-react";

import { logoutAction } from "@/server/advising-actions";
import { requireSessionUser } from "@/server/advising-guards";

export default async function AdvisingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSessionUser();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="flex items-center gap-1 text-teal-700">
              <IconUser size={18} stroke={1.8} />
              پروفایل
            </Link>
            {user.role === "counselor" ? (
              <Link
                href="/counselor/students"
                className="flex items-center gap-1 text-slate-700"
              >
                <IconUsers size={18} stroke={1.8} />
                دانش‌آموزان من
              </Link>
            ) : null}
            <Link href="/" className="text-sm text-slate-500">
              خانه
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-700">{user.fullName}</span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100"
              >
                <IconLogout size={16} stroke={1.8} />
                خروج
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}
