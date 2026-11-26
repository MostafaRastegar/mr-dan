import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";
import { hasCapability, type Capability } from "@/modules/advising/domain/capabilities";
import { requireSessionUser } from "@/server/advising-guards";
import { AdvisingBottomBar } from "@/app/(advising)/advising-bottom-bar.view";
import { AdminNavLinks } from "./admin-nav";

type AdminLink = {
  href: string;
  label: string;
  testId: string;
  capability: Capability;
};

const ADMIN_LINKS: AdminLink[] = [
  {
    href: "/admin/users",
    label: "کاربران",
    testId: TEST_IDS.ADMIN.NAV_USERS,
    capability: "user:read",
  },
  {
    href: "/admin/catalog/fields",
    label: "رشته‌ها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("fields"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/grades",
    label: "پایه‌ها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("grades"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/subjects",
    label: "دروس",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("subjects"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/books",
    label: "کتاب‌ها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("books"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/needs",
    label: "نیازها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("needs"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/exams",
    label: "آزمون‌ها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("exams"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/catalog/chapters",
    label: "فصل‌ها",
    testId: TEST_IDS.ADMIN.NAV_CATALOG("chapters"),
    capability: "catalog:manage",
  },
  {
    href: "/admin/knowledge",
    label: "دانش RAG",
    testId: TEST_IDS.ADMIN.NAV_KNOWLEDGE,
    capability: "rag:manage",
  },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSessionUser();
  const links = ADMIN_LINKS.filter((link) =>
    hasCapability(user.role, link.capability),
  );

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-white"
      >
        رفتن به محتوای اصلی
      </a>

      <header
        className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 px-4 py-2 backdrop-blur md:px-6"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-2 py-1">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold">پنل مدیریت</h1>
            <Link
              href="/dashboard"
              className="flex min-h-[44px] items-center gap-1 rounded-xl px-3 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              data-testid={TEST_IDS.ADMIN.BACK}
            >
              <IconArrowRight size={18} stroke={1.8} aria-hidden="true" />
              <span className="hidden sm:inline">داشبورد</span>
            </Link>
          </div>
          <AdminNavLinks
            links={links.map(({ href, label, testId }) => ({
              href,
              label,
              testId,
            }))}
          />
        </nav>
      </header>

      <AdvisingBottomBar
        links={links.map(({ href, label, testId }) => ({ href, label, testId }))}
      />

      <main
        id="admin-content"
        className="mx-auto max-w-6xl px-4 pb-24 pt-5 md:px-6 md:pb-8 md:pt-8"
      >
        {children}
      </main>
    </div>
  );
}
