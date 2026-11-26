import Link from "next/link";

import { TEST_IDS } from "@/constants/test-ids";
import { hasCapability, type Capability } from "@/modules/advising/domain/capabilities";
import { requireSessionUser } from "@/server/advising-guards";

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
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold">پنل مدیریت</h1>
            <Link
              href="/dashboard"
              className="flex min-h-[44px] items-center rounded px-3 py-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2"
              data-testid={TEST_IDS.ADMIN.BACK}
            >
              بازگشت به داشبورد
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.testId}
                href={link.href}
                className="flex min-h-[44px] items-center rounded px-3 py-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2"
                data-testid={link.testId}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
