import type { ReactNode, Dispatch, SetStateAction } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Empty,
  type FormInstance,
} from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";

import { TEST_IDS } from "@/constants/test-ids";
import type { Need, Exam } from "@/modules/advising/domain/models";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";

interface StudyProfileFormViewProps {
  form: FormInstance;
  data: StudyProfileView;
  schoolMode: string | null;
  needId: string | null;
  takesMockExams: boolean;
  examId: string | null;
  taraz: string | null;
  occupiedHours: number[];
  homeworkAvg: string | null;
  courses: { id: string; title: string; mode: string; weeklyHours?: number }[];
  setSchoolMode: (value: string | null) => void;
  setNeedId: (value: string | null) => void;
  setTakesMockExams: (checked: boolean) => void;
  setExamId: (value: string | null) => void;
  setTaraz: (value: string | null) => void;
  setOccupiedHours: Dispatch<SetStateAction<number[]>>;
  setHomeworkAvg: (value: string | null) => void;
  courseMode: string | null;
  setCourseMode: (value: string | null) => void;
  courseHours: number | null;
  setCourseHours: (value: number | null) => void;
  handleAddCourse: () => void;
  handleRemoveCourse: (id: string) => void;
  handleSubmit: (values: Record<string, unknown>) => void;
  savedAt: boolean | null;
  formError: string | null;
}

const hoursInput = (
  value: number | null,
  onChange: (v: number | null) => void,
  testId: string,
) => (
  <InputNumber
    min={0}
    max={24}
    step={0.25}
    value={value}
    onChange={onChange}
    dir="ltr"
    data-testid={testId}
    className="w-[5rem]"
    placeholder="۰"
  />
);

export function StudyProfileFormView(
  props: StudyProfileFormViewProps,
): ReactNode {
  const {
    form,
    data,
    schoolMode,
    needId,
    takesMockExams,
    examId,
    taraz,
    occupiedHours,
    homeworkAvg,
    courses,
    setSchoolMode,
    setNeedId,
    setTakesMockExams,
    setExamId,
    setTaraz,
    setOccupiedHours,
    setHomeworkAvg,
    courseMode,
    setCourseMode,
    courseHours,
    setCourseHours,
    handleAddCourse,
    handleRemoveCourse,
    handleSubmit,
    savedAt,
    formError,
  } = props;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.PROFILE.STUDY_CARD}
    >
      <h2 className="mb-4 text-lg font-semibold">مشخصات تحصیلی</h2>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
        data-testid={TEST_IDS.PROFILE.FORM}
      >
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Form.Item
            name="schoolMode"
            label="حالت مدرسه"
            rules={[{ required: true, message: "حالت مدرسه را انتخاب کنید" }]}
          >
            <Select
              value={schoolMode ?? undefined}
              onChange={setSchoolMode}
              allowClear
              placeholder="انتخاب کنید"
              data-testid={TEST_IDS.PROFILE.SCHOOL_MODE}
            >
              <Select.Option value="in_person">حضوری</Select.Option>
              <Select.Option value="virtual">مجازی</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="needId"
            label="نیاز"
            rules={[{ required: true, message: "نیاز را انتخاب کنید" }]}
          >
            <Select
              value={needId ?? undefined}
              onChange={setNeedId}
              allowClear
              placeholder="انتخاب کنید"
              data-testid={TEST_IDS.PROFILE.NEED}
            >
              {data.needs.map((n: Need) => (
                <Select.Option key={n.id} value={n.id}>
                  {n.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <fieldset className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm text-slate-700">
            آزمونهای آزمایشی
          </legend>

          <div className="flex items-center gap-3">
            <Switch
              checked={takesMockExams}
              onChange={setTakesMockExams}
              data-testid={TEST_IDS.PROFILE.MOCK_EXAMS}
              checkedChildren="بله"
              unCheckedChildren="خیر"
            />
            <span className="text-sm text-slate-600">
              شرکت در آزمونهای آزمایشی
            </span>
          </div>

          {takesMockExams ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Form.Item
                name="examId"
                label="آزمون"
                rules={[{ required: true, message: "آزمون را انتخاب کنید" }]}
              >
                <Select
                  value={examId ?? undefined}
                  onChange={setExamId}
                  allowClear
                  placeholder="انتخاب کنید"
                  data-testid={TEST_IDS.PROFILE.EXAM}
                >
                  {data.exams.map((e: Exam) => (
                    <Select.Option key={e.id} value={e.id}>
                      {e.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="taraz"
                label="تراز"
                rules={[
                  { required: true, message: "تراز را وارد کنید" },
                  {
                    min: 0,
                    max: 10000,
                    message: "تراز باید بین ۰ تا ۱۰۰۰۰ باشد",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  max={10000}
                  value={taraz != null ? Number(taraz) : null}
                  onChange={(v) => setTaraz(v != null ? String(v) : null)}
                  dir="ltr"
                  data-testid={TEST_IDS.PROFILE.TARAZ}
                  className="w-full"
                />
              </Form.Item>
            </div>
          ) : null}

          {data.examResults.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">تراز دو آزمون آخر</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-1 border-b border-slate-200">
                      آزمون
                    </th>
                    <th className="text-left pb-1 border-b border-slate-200">
                      تراز
                    </th>
                    <th className="text-left pb-1 border-b border-slate-200">
                      تاریخ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.examResults.map((r) => {
                    const exam = data.exams.find((e) => e.id === r.examId);
                    return (
                      <tr key={r.id}>
                        <td className="py-1 border-b border-slate-100">
                          {exam?.label ?? r.examId}
                        </td>
                        <td
                          className="py-1 border-b border-slate-100"
                          dir="ltr"
                        >
                          {r.taraz}
                        </td>
                        <td className="py-1 border-b border-slate-100 text-xs text-slate-500">
                          {r.createdAt.toLocaleDateString("fa-IR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              هنوز نتیجه‌ای ثبت نشده است
            </p>
          )}
        </fieldset>

        <fieldset className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm text-slate-700">
            ساعتهای اشغال هفته (غیر-مدرسه)
          </legend>
          <p className="text-xs text-slate-500">ساعة روز، شنبه تا جمعه</p>
          <div className="grid gap-2 md:grid-cols-7">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.day} className="flex flex-col items-center gap-1">
                <label className="text-xs text-slate-500" title={day.label}>
                  {day.label}
                </label>
                {hoursInput(
                  occupiedHours[day.day] ?? 0,
                  (v) =>
                    setOccupiedHours((prev: number[]) => {
                      const next = prev.slice();
                      next[day.day] = v ?? 0;
                      return next;
                    }),
                  `${TEST_IDS.PROFILE.OCCUPIED_HOURS}-${day.day}`,
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="mb-6">
          <Form.Item
            name="homeworkAverageHours"
            label="میانگین روزانه تکلیف مدرسه (ساعت)"
            rules={[{ min: 0, max: 12, message: "حداکثر ۱۲ ساعت" }]}
          >
            {hoursInput(
              homeworkAvg != null ? Number(homeworkAvg) : null,
              (v) => setHomeworkAvg(v != null ? String(v) : null),
              TEST_IDS.PROFILE.HOMEWORK_AVG,
            )}
          </Form.Item>
        </div>

        <fieldset className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm text-slate-700">
            کلاسهای تکمیلی
          </legend>

          {courses.length === 0 ? (
            <Empty description="هیچ کلاس تکمیلی ثبت نشده است" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {courses.map(
                (course: {
                  id: string;
                  title: string;
                  mode: string;
                  weeklyHours?: number;
                }) => (
                  <li
                    key={course.id}
                    className="flex items-center justify-between gap-2 p-2 border border-slate-100 rounded"
                  >
                    <span className="text-sm flex-1">{course.title}</span>
                    <span className="text-xs text-slate-500 dir-ltr">
                      {course.mode === "in_person" ? "حضوری" : "مجازی"}
                      {course.weeklyHours != null
                        ? ` · ${course.weeklyHours} س/س`
                        : ""}
                    </span>
                    <Button
                      size="small"
                      danger
                      onClick={() => handleRemoveCourse(course.id)}
                      data-testid={TEST_IDS.PROFILE.COURSE_DELETE}
                    >
                      حذف
                    </Button>
                  </li>
                ),
              )}
            </ul>
          )}

          <div className="grid gap-3 sm:grid-cols-4">
            <Form.Item
              name="courseTitle"
              label="عنوان"
              rules={[{ required: true, message: "عنوان کلاس را وارد کنید" }]}
            >
              <Input
                placeholder="مثلاً کلاس ریاضی خصوصی"
                data-testid={TEST_IDS.FORM.INPUT("courseTitle")}
              />
            </Form.Item>

            <Form.Item name="courseMode" label="حالت">
              <Select
                value={courseMode ?? undefined}
                onChange={setCourseMode}
                allowClear
                placeholder="حضوری / مجازی"
                data-testid={TEST_IDS.FORM.SELECT("courseMode")}
              >
                <Select.Option value="in_person">حضوری</Select.Option>
                <Select.Option value="virtual">مجازی</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="courseHours" label="ساعت/ هفته">
              {hoursInput(
                courseHours,
                setCourseHours,
                TEST_IDS.FORM.INPUT("courseHours"),
              )}
            </Form.Item>

            <Form.Item label=" " colon={false} className="mb-0 flex items-end">
              <Button
                type="primary"
                onClick={handleAddCourse}
                data-testid={TEST_IDS.PROFILE.COURSE_ADD}
              >
                افزودن
              </Button>
            </Form.Item>
          </div>
        </fieldset>

        {savedAt ? (
          <p
            className="mb-4 text-sm text-teal-700"
            role="status"
            data-testid={TEST_IDS.PROFILE.STUDY_SAVED}
          >
            ذخیره شد.
          </p>
        ) : null}
        {formError ? (
          <p
            className="mb-4 text-sm text-red-600"
            role="alert"
            data-testid={TEST_IDS.PROFILE.STUDY_ERROR}
          >
            {formError}
          </p>
        ) : null}

        <Form.Item className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            data-testid={TEST_IDS.FORM.SUBMIT("study-profile")}
          >
            ذخیره
          </Button>
        </Form.Item>
      </Form>
    </section>
  );
}
