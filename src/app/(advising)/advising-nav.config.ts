import { TEST_IDS } from "@/constants/test-ids";
import type { Capability } from "@/modules/advising/domain/capabilities";
import type { Role } from "@/modules/advising/domain/models";

export type NavLink = {
  href: string;
  label: string;
  testId: string;
  capability?: Capability;
  roles?: Role[];
};

export type NavGroup = { heading: string | null; links: NavLink[] };

/**
 * Single source for the advising nav. The architecture test locks each
 * capability-backed link's `roles` array to the capability-holder set, so a
 * reachable-but-rejected page or a dead link fails CI.
 *
 * Links without a capability (`/dashboard`, `/chat`) are not synced.
 */
export const NAV_GROUPS: NavGroup[] = [
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
        roles: ["student"],
      },
      {
        href: "/nutrition",
        label: "تغذیه",
        testId: TEST_IDS.NAV.NUTRITION,
        capability: "nutrition:read",
        roles: ["student"],
      },
      {
        href: "/homework",
        label: "همهٔ تکالیف",
        testId: TEST_IDS.NAV.HOMEWORK,
        capability: "homework:read",
        roles: ["student"],
      },
      {
        href: "/profile",
        label: "پروفایل",
        testId: TEST_IDS.NAV.PROFILE,
        capability: "profile:read",
        roles: ["student", "counselor", "admin", "operator"],
      },
      {
        href: "/chat",
        label: "مشاور هوشمند",
        testId: TEST_IDS.NAV.CHAT,
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
