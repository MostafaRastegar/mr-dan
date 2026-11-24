import type { ReactNode } from "react";
import { Button, Form, Input, InputNumber, Select, Badge, Spin, type FormInstance } from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { formatDuration } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";
import {
  CHAPTERS,
  type CounselorStudentData,
  type ChapterOption,
  type StudyPlanEntry,
} from "./counselor-student.fixture";
import { SubjectProgressView } from "./_components/subject-progress.view";
import { SchoolProgramAccordionView } from "./_components/school-program-accordion.view";

interface CounselorStudentViewProps {
  data: CounselorStudentData;
  demo: "success" | "empty" | "loading" | "error";
  form: FormInstance;
  testsTarget: string | null;
  planEntries: StudyPlanEntry[];
  weeklyTotal: number;
  subjectTotals: Record<string, number>;
  setTestsTarget: (value: string | null) => void;
  handleAddEntry: (
    dayOfWeek: number,
    subject: string,
    hours: number,
    chapterIds: string[],
    note: string | null,
  ) => void;
  handleDeleteEntry: (id: string) => void;
  availableChapters: ChapterOption[];
  setPlanChapter: (ids: string[]) => void;
  planChapter: string[];
  planNote: string | null;
  setPlanNote: (value: string | null) => void;
}

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

function dayLabel(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find((d) => d.day === dayOfWeek);
  return day ? day.label : String(dayOfWeek);
}

export function CounselorStudentView(props: CounselorStudentViewProps): ReactNode {
  const {
    data,
    demo,
    form,
    testsTarget,
    planEntries,
    weeklyTotal,
    subjectTotals,
    setTestsTarget,
    handleAddEntry,
    handleDeleteEntry,
    availableChapters,
    setPlanChapter,
    planChapter,
    planNote,
    setPlanNote,
  } = props;

  const schoolModeLabel = (mode: string | null): string => {
    if (mode === "in_person") return "حضوری";
    if (mode === "virtual") return "مجازی";
    return "ثبت نشده";
  };

  const courseModeLabels: Record<string, string> = {
    in_person: "حضوری",
    virtual: "مجازی",
  };

  function formatChapterList(chapterIds: string[]): string {
    if (chapterIds.length === 0) return "—";
    const labels = chapterIds.map((id) => {
      const chapter = CHAPTERS.find((c) => c.id === id);
      return chapter ? `فصل ${persianDigits.format(chapter.number)}` : "فصل نامشخص";
    });
    return labels.join("، ");
  }

  if (demo === "loading") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-6" data-testid={TEST_IDS.COUNSELOR_PLAN.PAGE}>
        <Spin size="large" />
      </section>
    );
  }

  if (demo === "error") {
    return (
      <section
        className="rounded-xl border border-red-200 bg-red-50 p-6"
        role="alert"
        data-testid={TEST_IDS.DASHBOARD.DEMO_ERROR}
      >
        <p className="text-sm text-red-700">خطا در بارگذاری صفحات دانش‌آموز. دوباره امتحان کنید.</p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid={TEST_IDS.COUNSELOR_PLAN.PAGE}>
      <section className="rounded-xl border border-slate-200 bg-white p-6" data-testid={TEST_IDS.COUNSELOR_PLAN.HEADER}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold">{data.fullName}</h1>
            <p className="text-sm text-slate-500" dir="ltr">
              {data.username} · {data.groupName ?? "بدون گروه"}
            </p>
          </div>
          {data.need ? (
            <Badge color="blue" className="text-sm" data-testid={TEST_IDS.COUNSELOR_PLAN.NEED_BADGE}>
              نیاز: {data.need.label}
            </Badge>
          ) : (
            <Badge color="gray" className="text-sm">
              نیاز ثبت نشده
            </Badge>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.SCHOOL_MODE}>
        <h2 className="mb-3 text-lg font-semibold">مشخصات تحصیلی</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex justify-between px-3 py-2 border border-slate-100 rounded">
            <span>حالت مدرسه</span>
            <span className="dir-ltr font-medium">{schoolModeLabel(data.schoolMode)}</span>
          </li>
          <li className="flex justify-between px-3 py-2 border border-slate-100 rounded">
            <span>آزمون آزمایشی</span>
            <span className="dir-ltr font-medium">
              {data.takesMockExams === true ? "می‌دهد" : data.takesMockExams === false ? "نمی‌دهد" : "ثبت نشده است"}
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ مدرسه</h2>
        <SchoolProgramAccordionView
          entries={data.schoolProgram.map((e) => ({
            id: e.id,
            dayOfWeek: e.dayOfWeek,
            subjectLabel: e.subjectLabel,
            minutes: e.minutes,
          }))}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_PLAN.EXAM_SUMMARY}>
        <h2 className="mb-3 text-lg font-semibold">تراز دو آزمون آخر</h2>
        {data.results.length === 0 ? (
          <p className="text-sm text-slate-500">هنوز نتیجه‌ای ثبت نشده است</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {data.results.map((r) => (
              <li key={r.id} className="flex justify-between px-3 py-2 border border-slate-100 rounded">
                <span>{r.examLabel}</span>
                <span className="dir-ltr font-medium">{r.taraz}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.OCCUPIED_HOURS}>
        <h2 className="mb-3 text-lg font-semibold">ساعتهای اشغال هفته (غیرمدرسه)</h2>
        {data.otherOccupiedMinutes.length === 0 || data.otherOccupiedMinutes.every((m) => m === 0) ? (
          <p className="text-sm text-slate-500">دانش‌آموز هنوز ساعت‌های اشغال هفته را ثبت نکرده است.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-7 text-sm">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d.day} className="border border-slate-100 rounded p-2 flex flex-col items-center">
                <span className="text-xs text-slate-500">{d.label}</span>
                <span className="font-medium dir-ltr">{persianDigits.format(data.otherOccupiedMinutes[d.day] ?? 0)}</span>
              </div>
            ))}
          </div>
        )}
        {data.homeworkAverageMinutes != null ? (
          <p className="mt-3 text-sm text-slate-500">
            میانگین روزانه تکلیف: {persianDigits.format(data.homeworkAverageMinutes)} دقیقه
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-500">میانگین روزانه تکلیف ثبت نشده است.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.COURSES}>
        <h2 className="mb-3 text-lg font-semibold">کلاس‌های تکمیلی</h2>
        {data.courses.length === 0 ? (
          <p className="text-sm text-slate-500">دانش‌آموز کلاس تکمیلی ثبت نکرده است.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {data.courses.map((c) => (
              <li key={c.id} className="flex justify-between px-3 py-2 border border-slate-100 rounded">
                <span>{c.title}</span>
                <span className="flex items-center gap-2">
                  <span>{courseModeLabels[c.mode]}</span>
                  <span className="dir-ltr font-medium">{persianDigits.format(c.weeklyHours)} ساعت/هفته</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_VIEW.WEEKLY_SCHEDULE}>
        <h2 className="mb-3 text-lg font-semibold">برنامه هفتگی دانش‌آموز</h2>
        {data.weeklySchedule.length === 0 ? (
          <p className="text-sm text-slate-500">دانش‌آموز برنامه زمانی هفتگی ثبت نکرده است.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-sm">
            {data.weeklySchedule.map((s) => (
              <li key={s.id} className="flex justify-between px-3 py-2 border border-slate-100 rounded">
                <span>{dayLabel(s.dayOfWeek)}</span>
                <span className="flex items-center gap-2">
                  <span className="dir-ltr font-medium">
                    {persianDigits.format(Math.floor(s.startMinute / 60))}:{persianDigits.format(s.startMinute % 60).toString().padStart(2, "۰")}
                    –
                    {persianDigits.format(Math.floor(s.endMinute / 60))}:{persianDigits.format(s.endMinute % 60).toString().padStart(2, "۰")}
                  </span>
                  <span>{s.subjectLabel}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SubjectProgressView
        entries={planEntries.map((e) => ({
          subject: e.subject,
          subjectLabel: e.subjectLabel,
          plannedMinutes: e.minutes,
          studiedMinutes: e.studiedMinutes ?? 0,
          testsDone: e.testsDone ?? 0,
        }))}
        testsTarget={data.goalProgress?.testsTarget ?? 0}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5" data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_EDITOR}>
        <h2 className="mb-3 text-lg font-semibold">برنامهٔ هفتگی مشاور</h2>

        <div className="grid gap-3 sm:grid-cols-4 mb-4">
          <Form.Item
            name="testsTarget"
            label="هدف تست (تست)"
            rules={[{ min: 0, max: 2000, message: "بین ۰ تا ۲۰۰۰" }]}
          >
            <InputNumber
              min={0}
              max={2000}
              value={testsTarget != null ? Number(testsTarget) : null}
              onChange={(v) => setTestsTarget(v != null ? String(v) : null)}
              dir="ltr"
              data-testid={TEST_IDS.COUNSELOR_PLAN.TESTS_TARGET}
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="planDay"
            label="روز"
            rules={[{ required: true, message: "روز را انتخاب کنید" }]}
          >
            <Select placeholder="انتخاب روز" data-testid={TEST_IDS.FORM.SELECT("planDay")}>
              {DAYS_OF_WEEK.map((d) => (
                <Select.Option key={d.day} value={d.day}>{d.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="planSubject"
            label="درس"
            rules={[{ required: true, message: "درس را انتخاب کنید" }]}
          >
            <Select allowClear placeholder="انتخاب درس" data-testid={TEST_IDS.FORM.SELECT("planSubject")}>
              <Select.Option value="riazi">ریاضی</Select.Option>
              <Select.Option value="fizik">فیزیک</Select.Option>
              <Select.Option value="adabiat">ادبیات</Select.Option>
              <Select.Option value="zist">زیست‌شناسی</Select.Option>
              <Select.Option value="shimi">شیمی</Select.Option>
              <Select.Option value="english">زبان انگلیسی</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="planChapter"
            label="فصل‌ها"
            rules={[]}
          >
            <Select
              mode="multiple"
              value={planChapter}
              onChange={setPlanChapter}
              placeholder="انتخاب فصل‌ها"
              data-testid={TEST_IDS.COUNSELOR_PLAN.CHAPTERS}
            >
              {availableChapters.map((c) => (
                <Select.Option key={c.id} value={c.id} disabled={!c.active}>
                  {`فصل ${persianDigits.format(c.number)}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="planHours"
            label="ساعت"
            rules={[{ required: true, message: "ساعت را وارد کنید" }]}
          >
            <InputNumber min={0.25} max={12} step={0.25} dir="ltr" className="w-full" />
          </Form.Item>

          <Form.Item
            name="planNote"
            label="یادداشت"
            rules={[]}
          >
            <Input.TextArea
              rows={2}
              value={planNote ?? ""}
              onChange={(e) => setPlanNote(e.target.value)}
              placeholder="یادداشت اختیاری (حداکثر ۲۰۰ کاراکتر)"
              data-testid={TEST_IDS.COUNSELOR_PLAN.NOTE}
            />
          </Form.Item>

          <Form.Item label=" " colon={false} className="mb-0 flex items-end">
            <Button
              type="primary"
              onClick={() => {
                const dayOfWeekVal = form.getFieldValue("planDay");
                const subjectVal = form.getFieldValue("planSubject") as string;
                const hoursVal = Number(form.getFieldValue("planHours"));
                if (!dayOfWeekVal || !subjectVal || !hoursVal) return;
                handleAddEntry(
                  Number(dayOfWeekVal),
                  subjectVal,
                  hoursVal,
                  planChapter,
                  planNote,
                );
                form.setFieldsValue({ planDay: "", planSubject: "", planHours: "" });
                setPlanChapter([]);
                setPlanNote("");
              }}
              data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_ENTRY_FORM}
            >
              افزودن ردیف
            </Button>
          </Form.Item>
        </div>

        <div className="mb-4">
          <span className="text-sm text-slate-500">جمع هفتگی:</span>{" "}
          <span className="text-lg font-bold dir-ltr" data-testid={TEST_IDS.COUNSELOR_PLAN.WEEKLY_TOTAL}>
            {formatDuration(weeklyTotal)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left p-2 border-b border-slate-200">روز</th>
                <th className="text-left p-2 border-b border-slate-200">درس</th>
                <th className="text-left p-2 border-b border-slate-200 dir-ltr">ساعت</th>
                <th className="text-left p-2 border-b border-slate-200" data-testid={TEST_IDS.COUNSELOR_PLAN.CHAPTER_COLUMN}>فصل‌ها</th>
                <th className="text-left p-2 border-b border-slate-200" data-testid={TEST_IDS.COUNSELOR_PLAN.NOTE_COLUMN}>یادداشت</th>
                <th className="text-right p-2 border-b border-slate-200">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {planEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="p-2">{dayLabel(entry.dayOfWeek)}</td>
                  <td className="p-2">{entry.subjectLabel}</td>
                  <td className="p-2 dir-ltr">{formatDuration(entry.minutes)}</td>
                  <td className="p-2 text-sm">{formatChapterList(entry.chapterIds)}</td>
                  <td className="p-2 text-sm">{entry.note ?? "—"}</td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-xs text-red-600 hover:underline"
                      aria-label="حذف"
                      data-testid={TEST_IDS.COUNSELOR_PLAN.PLAN_ROW_DELETE}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
              {planEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-2 text-center text-slate-400 text-sm">
                    هنوز ردیفی ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {Object.entries(subjectTotals).map(([subject, totalMinutes]) => (
            <div key={subject} className="border border-slate-100 rounded p-2 text-sm">
              <span className="text-slate-500">{subject}</span>
              <span className="text-slate-900 dir-ltr" style={{ float: "right" }}>{formatDuration(totalMinutes)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
