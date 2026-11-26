"use client";

import Link from "next/link";

import { FormSheet } from "@/app/_components/form-sheet";

import { navIcon, useActiveRoute, type AdvisingNavLink } from "./advising-nav.vm";

/** "More" bottom sheet: full menu as a divided list, closes on navigation. */
export function AdvisingMoreSheet({
  open,
  onClose,
  links,
}: {
  open: boolean;
  onClose: () => void;
  links: AdvisingNavLink[];
}) {
  const { isActive } = useActiveRoute();

  return (
    <FormSheet open={open} onClose={onClose} title="منو">
      <ul className="grid" role="menu">
        {links.map((link, index) => (
          <li key={link.testId} role="none">
            <Link
              href={link.href}
              onClick={onClose}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`relative flex min-h-[52px] items-center gap-3 px-2 py-2 text-[15px] text-slate-800 no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                index > 0 ? "border-t border-slate-200/70" : ""
              }`}
              data-testid={link.testId}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  isActive(link.href)
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
                aria-hidden="true"
              >
                {navIcon(link.href, 20)}
              </span>
              <span className={isActive(link.href) ? "font-semibold text-teal-800" : ""}>
                {link.label}
              </span>
              {isActive(link.href) ? (
                <span
                  className="absolute inset-y-2 right-0 w-1 rounded-full bg-teal-700"
                  aria-hidden="true"
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </FormSheet>
  );
}
