"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navIcon, type AdvisingNavLink } from "@/app/(advising)/advising-nav.vm";

export function AdminNavLinks({ links }: { links: AdvisingNavLink[] }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="hidden flex-wrap gap-2 md:flex">
      {links.map((link) => (
        <Link
          key={link.testId}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={`flex min-h-[44px] items-center gap-2 rounded-xl px-3 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
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
  );
}
