/**
 * Mock counselor-student data for the UI stage.
 *
 * Built from real domain model shapes; deleted in Stage Backend when the real
 * use case wires the page. One constant only — no env flag, no container.
 *
 * `searchParams.demo` drives the state: success | empty | loading | error.
 */

import type { DayOfWeek } from "@/modules/advising/domain/models";

export interface NeedOption {
  id: string;
  label: string;
}

export interface ExamOption {
  id: string;
  label: string;
}

export interface StudentExamResult {
  id: string;
  examId: string;
  examLabel: string;
  taraz: number; // 0..10000
  createdAt: Date;
}

export interface SchoolProgramEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  subject: string;
  subjectLabel: string;
  minutes: number;
  hours: number; // derived: minutes / 60
}

export interface StudyPlanEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  subject: string;
  subjectLabel: string;
  minutes: number; // planned minutes
  hours: number; // derived: minutes / 60
  studiedMinutes?: number; // studied this week (constant map; no study-block table in UI stage)
  testsDone?: number; // tests done for this subject
  chapterIds: string[];
  note: string | null;
}

export interface StudyPlan {
  id: string;
  studentId: string;
  testsTarget: number;
  entries: StudyPlanEntry[];
}

export interface SupplementaryCourse {
  id: string;
  title: string;
  mode: "in_person" | "virtual";
  weeklyHours: number;
}

export interface WeeklyScheduleEntry {
  id: string;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
  subject: string;
  subjectLabel: string;
}

export interface GoalProgress {
  studyMinutes: number;
  studyTarget: number;
  testsDone: number;
  testsTarget: number;
}

export interface ChapterOption {
  id: string;
  subject: string;
  field: string;
  grade: string;
  number: number;
  title: string;
  active: boolean;
}

export interface CounselorStudentData {
  studentId: string;
  username: string;
  fullName: string;
  groupName: string | null;
  grade: string | null;
  fieldOfStudy: string | null;
  need: NeedOption | null;
  schoolMode: "in_person" | "virtual" | null;
  takesMockExams: boolean | null;
  schoolProgram: SchoolProgramEntry[];
  results: StudentExamResult[]; // last two, most recent first
  otherOccupiedMinutes: number[]; // 7 entries, index = dayOfWeek
  homeworkAverageMinutes: number | null;
  courses: SupplementaryCourse[];
  weeklySchedule: WeeklyScheduleEntry[];
  plan: StudyPlan | null;
  goalProgress: GoalProgress | null;
}

export const NEEDS: NeedOption[] = [
  { id: "need-konkur", label: "کنکور" },
  { id: "need-afzayesh", label: "افزایش معدل" },
  { id: "need-tarmim", label: "ترمیم معدل" },
];

export const EXAMS: ExamOption[] = [
  { id: "exam-qalamchi", label: "قلمچی" },
  { id: "exam-ghazineh", label: "گزینه دو" },
];

export const CHAPTERS: ChapterOption[] = [
  // ریاضی — دوازدهم، ریاضی فیزیک
  { id: "ch-math-1", subject: "riazi", field: "ریاضی فیزیک", grade: "دوازدهم", number: 1, title: "فصل ۱", active: true },
  { id: "ch-math-2", subject: "riazi", field: "ریاضی فیزیک", grade: "دوازدهم", number: 2, title: "فصل ۲", active: true },
  { id: "ch-math-3", subject: "riazi", field: "ریاضی فیزیک", grade: "دوازدهم", number: 3, title: "فصل ۳", active: true },
  // فیزیک — دوازدهم، ریاضی فیزیک
  { id: "ch-phys-1", subject: "fizik", field: "ریاضی فیزیک", grade: "دوازدهم", number: 1, title: "فصل ۱", active: true },
  // ادبیات — دوازدهم، ریاضی فیزیک (موجود برای demonstration)
  { id: "ch-lit-1", subject: "adabiat", field: "ریاضی فیزیک", grade: "دوازدهم", number: 1, title: "فصل ۱", active: true },
  // عمومی — field: "" اعمال به همه رشته‌ها
  { id: "ch-eng-1", subject: "english", field: "", grade: "دوازدهم", number: 1, title: "فصل ۱", active: true },
  // غیرفعال — ارائه نشود در سیلیکتور
  { id: "ch-inactive", subject: "riazi", field: "ریاضی فیزیک", grade: "دوازدهم", number: 9, title: "فصل ۹", active: false },
];

const SATURDAY: DayOfWeek = 0;
const MONDAY: DayOfWeek = 1;
const TUESDAY: DayOfWeek = 2;
const WEDNESDAY: DayOfWeek = 3;

export const COUNSELOR_STUDENT_FIXTURE: CounselorStudentData = {
  studentId: "s-1",
  username: "student",
  fullName: "علی احمدی",
  groupName: "کلاس دوازدهم تجربی",
  grade: "دوازدهم",
  fieldOfStudy: "ریاضی فیزیک",
  need: NEEDS[0],
  schoolMode: "in_person",
  takesMockExams: true,
  schoolProgram: [
    { id: "sp-1", dayOfWeek: MONDAY, subject: "riazi", subjectLabel: "ریاضی", minutes: 180, hours: 3 },
    { id: "sp-2", dayOfWeek: TUESDAY, subject: "fizik", subjectLabel: "فیزیک", minutes: 120, hours: 2 },
    { id: "sp-3", dayOfWeek: SATURDAY, subject: "adabiat", subjectLabel: "ادبیات", minutes: 90, hours: 1.5 },
  ],
  results: [
    {
      id: "res-1",
      examId: "exam-qalamchi",
      examLabel: "قلمچی",
      taraz: 1850,
      createdAt: new Date(2026, 9, 15),
    },
    {
      id: "res-2",
      examId: "exam-ghazineh",
      examLabel: "گزینه دو",
      taraz: 1720,
      createdAt: new Date(2026, 9, 1),
    },
  ],
  otherOccupiedMinutes: [60, 90, 45, 30, 60, 0, 30],
  homeworkAverageMinutes: 60,
  courses: [
    { id: "c-1", title: "كلیه پیاده‌سازی", mode: "in_person", weeklyHours: 2 },
    { id: "c-2", title: "آموزش زبان", mode: "virtual", weeklyHours: 1.5 },
  ],
  weeklySchedule: [
    { id: "ws-1", dayOfWeek: MONDAY, startMinute: 540, endMinute: 720, subject: "riazi", subjectLabel: "ریاضی" },
    { id: "ws-2", dayOfWeek: WEDNESDAY, startMinute: 600, endMinute: 780, subject: "fizik", subjectLabel: "فیزیک" },
  ],
  plan: {
    id: "plan-1",
    studentId: "s-1",
    testsTarget: 300,
    entries: [
      { id: "pe-1", dayOfWeek: MONDAY, subject: "riazi", subjectLabel: "ریاضی", minutes: 180, hours: 3, studiedMinutes: 120, testsDone: 40, chapterIds: ["ch-math-1", "ch-math-2"], note: "تمرکز روی نام-equalities" },
      { id: "pe-2", dayOfWeek: TUESDAY, subject: "fizik", subjectLabel: "فیزیک", minutes: 120, hours: 2, studiedMinutes: 60, testsDone: 20, chapterIds: [], note: null },
    ],
  },
  goalProgress: {
    studyMinutes: 300,
    studyTarget: 300,
    testsDone: 150,
    testsTarget: 300,
  },
};

export const EMPTY_COUNSELOR_STUDENT: CounselorStudentData = {
  studentId: "s-1",
  username: "student",
  fullName: "دانش‌آموز",
  groupName: null,
  grade: null,
  fieldOfStudy: null,
  need: null,
  schoolMode: null,
  takesMockExams: null,
  schoolProgram: [],
  results: [],
  otherOccupiedMinutes: [0, 0, 0, 0, 0, 0, 0],
  homeworkAverageMinutes: null,
  courses: [],
  weeklySchedule: [],
  plan: null,
  goalProgress: null,
};
