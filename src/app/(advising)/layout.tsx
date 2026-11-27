import { IconLogout } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { logoutAction } from "./advising.actions";
import { requireSessionUser } from "@/server/advising-guards";
import {
  AdvisingBottomBar,
} from "./advising-bottom-bar.view";
import { AdvisingRail } from "./advising-nav.view";
import type { AdvisingNavGroup } from "./advising-nav.vm";
import { NAV_GROUPS, type NavGroup } from "./advising-nav.config";

export default async function AdvisingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireSessionUser();

  const activeLinks = (group: NavGroup) =>
    group.links.filter(
      (link) =>
        (!link.roles || link.roles.includes(user.role)) &&
        (!link.capability || hasCapability(user.role, link.capability)),
    );

  const filteredGroups: AdvisingNavGroup[] = NAV_GROUPS.map((group) => ({
    heading: group.heading,
    links: activeLinks(group).map(({ href, label, testId }) => ({
      href,
      label,
      testId,
    })),
  }));
  const flatLinks = filteredGroups.flatMap((g) => g.links);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-teal-700 focus:px-4 focus:py-2 focus:text-white"
      >
        رفتن به محتوای اصلی
      </a>

      {/* Mobile app header: brand + logout. Desktop keeps the rail. */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/70 bg-white/95 px-4 py-2 backdrop-blur md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <span className="text-base font-bold" translate="no">
          mr-dan<span className="text-teal-600">.</span>
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="خروج"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            data-testid={TEST_IDS.NAV.LOGOUT}
          >
            <IconLogout size={20} stroke={1.8} aria-hidden="true" />
          </button>
        </form>
      </header>

      <div className="flex flex-row">
        <AdvisingRail groups={filteredGroups} />
        <AdvisingBottomBar links={flatLinks} />

        <main
          id="main-content"
          className="flex-1 mx-auto w-full max-w-4xl px-4 pb-24 pt-5 md:px-6 md:pb-8 md:pt-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
