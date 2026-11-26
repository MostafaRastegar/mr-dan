"use client";

import Link from "next/link";
import { useState } from "react";
import { IconDots } from "@tabler/icons-react";

import { AdvisingMoreSheet } from "./advising-more-sheet.view";
import { navIcon, useActiveRoute, type AdvisingNavLink } from "./advising-nav.vm";

/** How many destinations fit comfortably in the bar before "more". */
const MAX_PRIMARY = 4;

/** Mobile app-style bottom tab bar: first few destinations plus a
 *  "more" sheet — no horizontal scrolling. Used by advising and admin. */
export function AdvisingBottomBar({ links }: { links: AdvisingNavLink[] }) {
  const { isActive } = useActiveRoute();
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = links.slice(0, MAX_PRIMARY);
  const rest = links.slice(MAX_PRIMARY);
  const restActive = rest.some((link) => isActive(link.href));

  const tabClass = (active: boolean) =>
    `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
      active ? "font-semibold text-teal-700" : "text-slate-500"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="ناوبری اصلی"
    >
      <div className="flex">
        {primary.map((link) => (
          <Link
            key={link.testId}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={tabClass(isActive(link.href))}
            data-testid={link.testId}
          >
            {navIcon(link.href)}
            {link.label}
          </Link>
        ))}
        {rest.length > 0 ? (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            className={tabClass(restActive)}
          >
            <IconDots size={22} stroke={1.8} aria-hidden="true" />
            بیشتر
          </button>
        ) : null}
      </div>

      <AdvisingMoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        links={links}
      />
    </nav>
  );
}
