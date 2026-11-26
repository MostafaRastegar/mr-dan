import type { ReactNode } from "react";
import { Button, Form, InputNumber, Select, type FormInstance } from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import { subjectsForField, subjectLabel } from "@/modules/advising/domain/subjects";
import { formatDuration } from "@/modules/advising/presentation/planning-format";

import { TEST_IDS } from "@/constants/test-ids";
import { SchoolProgramTableView } from "./school-program-table.view";

export interface SchoolProgramEntry {
  id: string;
  dayOfWeek: number;
  subject: string;
  hours: number;
}

interface SchoolProgramFormViewProps {
  form: FormInstance;
  entries: SchoolProgramEntry[];
  fieldOfStudy: string | null;
  saved: boolean;
  formError: string | null;
  pending: boolean;
  submit: (values: Record<string, unknown>) => void;
  handleDelete: (id: string) => void;
}

function dayLabel(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find((d) => d.day === dayOfWeek);
  return day ? day.label : String(dayOfWeek);
}

export function SchoolProgramFormView(props: SchoolProgramFormViewProps): ReactNode {
  const {
    form,
    entries,
    fieldOfStudy,
    saved,
    formError,
    pending,
    submit,
    handleDelete,
  } = props;

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-testid={TEST_IDS.SCHOOL_PROGRAM.SECTION}
    >
      <h2 className="mb-4 text-lg font-semibold">برنامهٔ ثابت مدرسه</h2>
      <p className="mb-4 text-sm text-slate-500">
        روز + درس + ساعت (بدون محدوده زمانی). ساعت‌ها برای برنامه‌ریزی استفاده می‌شوند.
      </p>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.SCHOOL_PROGRAM.FORM}
      >
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <Form.Item
            name="dayOfWeek"
            label="روز"
            rules={[{ required: true, message: "روز را انتخاب کنید" }]}
          >
            <Select
              placeholder="انتخاب روز"
              data-testid={TEST_IDS.SCHOOL_PROGRAM.DAY_SELECT}
            >
              {DAYS_OF_WEEK.map((d) => (
                <Select.Option key={d.day} value={d.day}>
                  {d.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="درس"
            rules={[{ required: true, message: "درس را انتخاب کنید" }]}
          >
            <Select
              allowClear
              placeholder="انتخاب درس"
              data-testid={TEST_IDS.SCHOOL_PROGRAM.SUBJECT_SELECT}
            >
              {subjectsForField(fieldOfStudy).map((s) => (
                <Select.Option key={s.slug} value={s.slug}>
                  {s.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="hours"
            label="ساعت"
            rules={[
              { required: true, message: "ساعت را وارد کنید" },
              {
                type: "number",
                min: 0.25,
                max: 12,
                message: "بین ۰.۲۵ تا ۱۲ ساعت",
              },
            ]}
          >
            <InputNumber
              min={0.25}
              max={12}
              step={0.25}
              dir="ltr"
              data-testid={TEST_IDS.SCHOOL_PROGRAM.HOURS_INPUT}
              className="w-full"
            />
          </Form.Item>

          <Form.Item label=" " colon={false} className="mb-0 flex items-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={pending}
              data-testid={TEST_IDS.SCHOOL_PROGRAM.ADD_ROW}
            >
              افزودن ردیف
            </Button>
          </Form.Item>
        </div>

        {saved ? (
          <p className="mb-4 text-sm text-teal-700" role="status" data-testid={TEST_IDS.SCHEDULE.SAVED}>
            ذخیره شد.
          </p>
        ) : null}
        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}
      </Form>

      <SchoolProgramTableView
        entries={entries}
        onDelete={handleDelete}
        formatDuration={formatDuration}
        dayLabel={dayLabel}
        subjectLabel={subjectLabel}
      />
    </section>
  );
}
