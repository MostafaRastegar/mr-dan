/**
 * Mock dashboard data for the UI stage.
 *
 * Built from real domain models; deleted in Stage Backend B1 when the real
 * use case wires the page. One constant only — no env flag, no container.
 *
 * `DashboardData` and `DashboardGoal` are local read models: they are NOT the
 * domain `WeeklyGoal`, because advisor-program AP-2 deletes its target fields.
 */

import type { HomeworkItem, MealPlanRecord, WeeklyScheduleEntry } from "@/modules/advising/domain/models";
import type { StudyBlock } from "@/modules/advising/domain/study-blocks";
import { buildStudyBlocks } from "@/modules/advising/domain/study-blocks";
import { iranDayKey, persianDayOf, shiftDayKey } from "@/modules/advising/domain/day-key";

export interface DashboardGoal {
  studiedMinutes: number;
  studyMinutesTarget: number;
  testsTarget: number;
  testsDone: number;
}

export interface DashboardData {
  greetingName: string;
  todayKey: string;
  homework: { today: HomeworkItem[]; tomorrow: HomeworkItem[] };
  schedule: WeeklyScheduleEntry[];
  blocks: StudyBlock[];
  freeMinutes: number;
  freeTimeBreakdown: {
    wakingMinutes: number;
    schoolMinutes: number;
    otherOccupiedMinutes: number;
    homeworkAverageMinutes: number;
  };
  book: string | null;
  meal: {
    plan: MealPlanRecord | null;
    eatenSlots: string[];
    targetCalories: number | null;
    hasPhysicalProfile: boolean;
  };
  goal: DashboardGoal | null;
  needLabel: string;
  profile: {
    fullName: string;
    sleepMinutes: number | null;
    wakeMinutes: number | null;
    role: "student" | "counselor" | "admin";
  };
}

export const TODAY_KEY = iranDayKey(new Date());
export const TOMORROW_KEY = shiftDayKey(TODAY_KEY, 1);

const today = new Date();
const todayKey = iranDayKey(today);
const dayOfWeek = persianDayOf(todayKey);

const schedule: WeeklyScheduleEntry[] = [
  {
    id: "sch-1",
    studentId: "s-1",
    dayOfWeek,
    startMinute: 480,
    endMinute: 530,
    subject: "riazi",
    teacher: "استاد ریاضی",
    room: "۱۲",
    createdAt: today,
    updatedAt: today,
  },
  {
    id: "sch-2",
    studentId: "s-1",
    dayOfWeek,
    startMinute: 540,
    endMinute: 620,
    subject: "fizik",
    teacher: "استاد فیزیک",
    room: "۷",
    createdAt: today,
    updatedAt: today,
  },
  {
    id: "sch-3",
    studentId: "s-1",
    dayOfWeek,
    startMinute: 660,
    endMinute: 700,
    subject: "adabiat",
    teacher: null,
    room: null,
    createdAt: today,
    updatedAt: today,
  },
];

const blocks = schedule.flatMap((entry) =>
  buildStudyBlocks({
    dayKey: todayKey,
    startMinute: entry.startMinute,
    endMinute: entry.endMinute,
    subject: entry.subject,
  }),
);

export const DASHBOARD_FIXTURE: DashboardData = {
  greetingName: "سارا",
  todayKey,
  homework: {
    today: [
      {
        id: "hw-1",
        studentId: "s-1",
        title: "حل مشاغل ریاضی",
        subject: "riazi",
        priority: "high",
        deadline: today,
        completedAt: null,
        spentMinutes: null,
        createdAt: today,
        updatedAt: today,
      },
    ],
    tomorrow: [
      {
        id: "hw-2",
        studentId: "s-1",
        title: "گزارش آزمایشی شیمی",
        subject: "shimi",
        priority: "medium",
        deadline: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        completedAt: null,
        spentMinutes: null,
        createdAt: today,
        updatedAt: today,
      },
    ],
  },
  schedule,
  blocks,
  freeMinutes: 510,
  freeTimeBreakdown: {
    wakingMinutes: 990, // 23:00 → 06:30
    schoolMinutes: 240, // derived from the school program (4h)
    otherOccupiedMinutes: 180, // non-school occupied (3h)
    homeworkAverageMinutes: 60, // average daily homework (1h)
  },
  book: "عادت‌های اتمی",
  meal: {
    plan: null,
    eatenSlots: [],
    targetCalories: null,
    hasPhysicalProfile: false,
  },
  goal: {
    studiedMinutes: 50,
    studyMinutesTarget: 1500, // derived from counselor plan total
    testsTarget: 300, // derived from counselor plan header
    testsDone: 0,
  },
  needLabel: "نیاز به ۱۴۵۰ دقیقه مطالعه بیشتر برای رسیدن به هدف هفته",
  profile: {
    fullName: "سارا احمدی",
    sleepMinutes: 1380,
    wakeMinutes: 390,
    role: "student",
  },
};

export const EMPTY_DASHBOARD: DashboardData = {
  ...DASHBOARD_FIXTURE,
  greetingName: "دانش‌آموز",
  homework: { today: [], tomorrow: [] },
  schedule: [],
  blocks: [],
  freeMinutes: 0,
  freeTimeBreakdown: {
    wakingMinutes: 0,
    schoolMinutes: 0,
    otherOccupiedMinutes: 0,
    homeworkAverageMinutes: 0,
  },
  book: null,
  meal: {
    plan: null,
    eatenSlots: [],
    targetCalories: null,
    hasPhysicalProfile: false,
  },
  goal: null,
  needLabel: "برنامهٔ مشاور ثبت نشده است",
  profile: {
    fullName: "دانش‌آموز",
    sleepMinutes: null,
    wakeMinutes: null,
    role: "student",
  },
};
