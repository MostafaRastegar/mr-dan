import type { ReactNode } from "react";
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
  submit: (values: Record<string, unknown>) => void;
  pending: boolean;
  coursePending: boolean;
  deletePending: boolean;
  formError: string | null;
  initialValues: Record<string, unknown>;
  saved: boolean;
  handleAddCourse: () => void;
  handleRemoveCourse: (id: string) => void;
}

const hoursInput = (testId: string) => (
  <InputNumber
    min={0}
    max={24}
    step={0.25}
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
    submit,
    pending,
    coursePending,
    deletePending,
    formError,
    initialValues,
    saved,
    handleAddCourse,
    handleRemoveCourse,
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
        onFinish={submit}
        data-testid={TEST_IDS.PROFILE.STUDY_FORM}
        initialValues={initialValues}
      >
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <Form.Item name="schoolMode" label="حالت مدرسه">
            <Select allowClear data-testid={TEST_IDS.PROFILE.SCHOOL_MODE}>
              <Select.Option value="in_person">حضوری</Select.Option>
              <Select.Option value="virtual">مجازی</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="needId" label="نیاز">
            <Select allowClear data-testid={TEST_IDS.PROFILE.NEED}>
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

          <Form.Item
            name="takesMockExams"
            valuePropName="checked"
            className="mb-0"
          >
            <Switch
              data-testid={TEST_IDS.PROFILE.MOCK_EXAMS}
              checkedChildren="بله"
              unCheckedChildren="خیر"
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, next) =>
              prev.takesMockExams !== next.takesMockExams
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("takesMockExams") ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Form.Item name="examId" label="آزمون">
                    <Select allowClear data-testid={TEST_IDS.PROFILE.EXAM}>
                      {data.exams.map((e: Exam) => (
                        <Select.Option key={e.id} value={e.id}>
                          {e.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="taraz" label="تراز">
                    <InputNumber
                      min={0}
                      max={10000}
                      dir="ltr"
                      data-testid={TEST_IDS.PROFILE.TARAZ}
                      className="w-full"
                    />
                  </Form.Item>
                </div>
              ) : null
            }
          </Form.Item>

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
                <Form.Item
                  name={`otherOccupied${day.day}`}
                  className="w-full"
                >
                  <InputNumber
                    min={0}
                    max={24}
                    step={0.25}
                    dir="ltr"
                    className="w-[5rem]"
                    placeholder="۰"
                    data-testid={`${TEST_IDS.PROFILE.OCCUPIED_HOURS}-${day.day}`}
                  />
                </Form.Item>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="mb-6">
          <Form.Item
            name="homeworkAverageHours"
            label="میانگین روزانه تکلیف مدرسه (ساعت)"
          >
            {hoursInput(TEST_IDS.PROFILE.HOMEWORK_AVG)}
          </Form.Item>
        </div>

        <fieldset className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm text-slate-700">
            کلاسهای تکمیلی
          </legend>

          {data.courses.length === 0 ? (
            <Empty description="هیچ کلاس تکمیلی ثبت نشده است" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.courses.map(
                (course: {
                  id: string;
                  title: string;
                  mode: string;
                  weeklyMinutes: number | null;
                }) => (
                  <li
                    key={course.id}
                    className="flex items-center justify-between gap-2 p-2 border border-slate-100 rounded"
                  >
                    <span className="text-sm flex-1">{course.title}</span>
                    <span className="text-xs text-slate-500 dir-ltr">
                      {course.mode === "in_person" ? "حضوری" : "مجازی"}
                      {course.weeklyMinutes != null
                        ? ` · ${Math.round(course.weeklyMinutes / 60)} س/س`
                        : ""}
                    </span>
                    <Button
                      size="small"
                      danger
                      loading={deletePending}
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
            >
              <Input
                placeholder="مثلاً کلاس ریاضی خصوصی"
                data-testid={TEST_IDS.FORM.INPUT("courseTitle")}
              />
            </Form.Item>

            <Form.Item name="courseMode" label="حالت">
              <Select
                allowClear
                placeholder="حضوری / مجازی"
                data-testid={TEST_IDS.FORM.SELECT("courseMode")}
              >
                <Select.Option value="in_person">حضوری</Select.Option>
                <Select.Option value="virtual">مجازی</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="courseHours" label="ساعت/ هفته">
              {hoursInput(TEST_IDS.FORM.INPUT("courseHours"))}
            </Form.Item>

            <Form.Item label=" " colon={false} className="mb-0 flex items-end">
              <Button
                type="primary"
                loading={coursePending}
                onClick={handleAddCourse}
                data-testid={TEST_IDS.PROFILE.COURSE_ADD}
              >
                افزودن
              </Button>
            </Form.Item>
          </div>
        </fieldset>

        {saved ? (
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
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("study-profile")}
          >
            ذخیره
          </Button>
        </Form.Item>
      </Form>
    </section>
  );
}
