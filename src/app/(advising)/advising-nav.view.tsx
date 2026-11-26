"use client";

import Link from "next/link";

import { navIcon, useActiveRoute, type AdvisingNavGroup } from "./advising-nav.vm";

export function AdvisingRail({ groups }: { groups: AdvisingNavGroup[] }) {
  const { isActive } = useActiveRoute();

  return (
    <nav className="hidden w-[15rem] shrink-0 border-r border-slate-200/70 bg-white px-4 py-3 md:block">
      <div className="flex flex-col">
        {groups.map((group) => (
          <div key={group.heading ?? "root"} className="flex flex-col gap-1">
            {group.heading && (
              <h3
                className="mt-5 mb-1 px-3 text-xs font-semibold text-slate-400"
                dir="rtl"
              >
                {group.heading}
              </h3>
            )}
            {group.links.map((link) => (
              <Link
                key={link.testId}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 min-h-[44px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                  isActive(link.href)
                    ? "bg-teal-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                data-testid={link.testId}
              >
                {navIcon(link.href)}
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}
