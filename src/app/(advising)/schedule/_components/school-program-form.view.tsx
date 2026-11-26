import type { ReactNode } from "react";
import { Button, Form, InputNumber, Select, type FormInstance } from "antd";
import { IconPlus } from "@tabler/icons-react";

import { FormSheet } from "@/app/_components/form-sheet";

import { DAYS_OF_WEEK, type SubjectRow } from "@/modules/advising/domain/models";
import { labelOf, subjectOptions } from "@/modules/advising/domain/catalog";
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
  isAddOpen: boolean;
  onOpenAdd: () => void;
  onCloseAdd: () => void;
  form: FormInstance;
  entries: SchoolProgramEntry[];
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  labels: Record<string, string>;
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
    isAddOpen,
    onOpenAdd,
    onCloseAdd,
    form,
    entries,
    fieldOfStudy,
    subjects,
    labels,
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
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">برنامهٔ ثابت مدرسه</h2>
          <p className="mt-1 text-sm text-slate-500">
            روز + درس + ساعت (بدون محدوده زمانی).
          </p>
        </div>
        <Button
          icon={<IconPlus size={16} stroke={2} aria-hidden="true" />}
          onClick={onOpenAdd}
          data-testid={TEST_IDS.SCHOOL_PROGRAM.OPEN_FORM}
        >
          افزودن ردیف
        </Button>
      </div>

      <FormSheet
        open={isAddOpen}
        onClose={onCloseAdd}
        title="افزودن ردیف برنامهٔ مدرسه"
        testId={TEST_IDS.SCHOOL_PROGRAM.FORM}
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          data-testid={TEST_IDS.SCHOOL_PROGRAM.FORM}
        >
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
              {subjectOptions(subjects, {
                field: fieldOfStudy,
                grade: null,
              }).map((s) => (
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

          <Form.Item className="mb-0 flex justify-end">
            <Button
              type="primary"
              htmlType="submit"
              loading={pending}
              data-testid={TEST_IDS.SCHOOL_PROGRAM.ADD_ROW}
            >
              افزودن ردیف
            </Button>
          </Form.Item>
        </Form>
      </FormSheet>

      <SchoolProgramTableView
        entries={entries}
        onDelete={handleDelete}
        formatDuration={formatDuration}
        dayLabel={dayLabel}
        subjectLabel={(slug) => labelOf(labels, slug)}
      />
    </section>
  );
}
