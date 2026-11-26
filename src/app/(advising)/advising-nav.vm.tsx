"use client";

import { usePathname } from "next/navigation";
import {
  IconApple,
  IconBook,
  IconBooks,
  IconCalendarWeek,
  IconDatabase,
  IconFileText,
  IconLayoutDashboard,
  IconListCheck,
  IconListDetails,
  IconListNumbers,
  IconMapPin,
  IconMessage,
  IconSettings,
  IconStairs,
  IconUser,
  IconUsersGroup,
} from "@tabler/icons-react";

export type AdvisingNavLink = {
  href: string;
  label: string;
  testId: string;
};

export type AdvisingNavGroup = {
  heading: string | null;
  links: AdvisingNavLink[];
};

const NAV_ICONS: Record<
  string,
  React.ComponentType<{ size: number; stroke: number }>
> = {
  "/dashboard": IconLayoutDashboard,
  "/schedule": IconCalendarWeek,
  "/nutrition": IconApple,
  "/homework": IconListCheck,
  "/profile": IconUser,
  "/chat": IconMessage,
  "/counselor": IconUsersGroup,
  "/admin": IconSettings,
  "/admin/users": IconUsersGroup,
  "/admin/knowledge": IconDatabase,
  "/admin/catalog/fields": IconMapPin,
  "/admin/catalog/grades": IconStairs,
  "/admin/catalog/subjects": IconBook,
  "/admin/catalog/books": IconBooks,
  "/admin/catalog/needs": IconListDetails,
  "/admin/catalog/exams": IconFileText,
  "/admin/catalog/chapters": IconListNumbers,
};

export function navIcon(href: string, size = 22) {
  const Icon = NAV_ICONS[href];
  return Icon ? <Icon size={size} stroke={1.8} /> : null;
}

/** Shared active-route logic for the desktop rail and mobile tab bar. */
export function useActiveRoute() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  return { isActive };
}
