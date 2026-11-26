import Link from "next/link";
import { IconLogout } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";
import { hasCapability, type Capability } from "@/modules/advising/domain/capabilities";
import type { Role } from "@/modules/advising/domain/models";
import { logoutAction } from "./advising.actions";
import { requireSessionUser } from "@/server/advising-guards";

type NavLink = {
  href: string;
  label: string;
  testId: string;
  capability?: Capability;
  roles?: Role[];
};

type NavGroup = { heading: string | null; links: NavLink[] };

export default async function AdvisingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSessionUser();

  const navGroups: NavGroup[] = [
    {
      heading: "داشبورد",
      links: [
        {
          href: "/dashboard",
          label: "داشبورد",
          testId: TEST_IDS.NAV.DASHBOARD,
          roles: ["student", "admin"],
        },
      ],
    },
    {
      heading: "تنظیمات",
      links: [
        {
          href: "/schedule",
          label: "برنامه هفتگی",
          testId: TEST_IDS.NAV.SCHEDULE,
          capability: "schedule:read",
          roles: ["student", "admin"],
        },
        {
          href: "/nutrition",
          label: "تغذیه",
          testId: TEST_IDS.NAV.NUTRITION,
          capability: "nutrition:read",
          roles: ["student", "admin"],
        },
        {
          href: "/homework",
          label: "همهٔ تکالیف",
          testId: TEST_IDS.NAV.HOMEWORK,
          capability: "homework:read",
          roles: ["student", "admin"],
        },
        {
          href: "/profile",
          label: "پروفایل",
          testId: TEST_IDS.NAV.PROFILE,
          capability: "profile:read",
          roles: ["student", "counselor", "admin", "operator"],
        },
      ],
    },
    {
      heading: "مشاور",
      links: [
        {
          href: "/counselor/students",
          label: "دانش‌آموزان من",
          testId: TEST_IDS.NAV.STUDENTS,
          capability: "group:manage",
          roles: ["counselor", "admin"],
        },
      ],
    },
    {
      heading: "مدیریت",
      links: [
        {
          href: "/admin",
          label: "مدیریت",
          testId: TEST_IDS.NAV.ADMIN,
          capability: "user:read",
          roles: ["admin", "operator"],
        },
      ],
    },
  ];

  const activeLinks = (group: NavGroup) =>
    group.links.filter(
      (link) =>
        (!link.roles || link.roles.includes(user.role)) &&
        (!link.capability || hasCapability(user.role, link.capability)),
    );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar: mobile horizontal scroll strip / desktop rail. Links rendered once; headings desktop-only. */}
        <nav
          className="w-full border-b border-slate-200 bg-white md:border-b-0 md:border-r md:w-[14rem] md:shrink-0 px-4 py-3"
        >
          <div
            className="flex flex-nowrap gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0"
          >
            {navGroups.map((group) => (
              <div key={group.heading ?? "root"} className="flex flex-col gap-2">
                {group.heading && (
                  <h3
                    className="mt-6 hidden md:block mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider"
                  dir="rtl"
                >
                  {group.heading}
                </h3>
                )}
                {activeLinks(group).map((link) => (
                  <Link
                    key={link.testId}
                    href={link.href}
                    className="flex items-center gap-2 shrink-0 rounded px-3 py-2 min-h-[44px] text-slate-700 hover:bg-slate-100"
                    data-testid={link.testId}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1 text-slate-700 hover:bg-slate-100"
                data-testid={TEST_IDS.NAV.LOGOUT}
              >
                <IconLogout size={16} stroke={1.8} />
                خروج
              </button>
            </form>
          </div>
        </nav>

        <main className="flex-1 mx-auto max-w-4xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
