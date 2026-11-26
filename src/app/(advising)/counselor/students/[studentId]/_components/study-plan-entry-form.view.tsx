import type { ReactNode } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  type FormInstance,
} from "antd";

import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import type { Chapter } from "@/modules/advising/domain/models";
import type { SubjectOption } from "@/modules/advising/domain/catalog";
import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

interface StudyPlanEntryFormViewProps {
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  saved: boolean;
  availableChapters: Chapter[];
  subjectOptions: SubjectOption[];
}

export function StudyPlanEntryFormView(
  props: StudyPlanEntryFormViewProps,
): ReactNode {
  const {
    form,
    submit,
    pending,
    formError,
    saved,
    availableChapters,
    subjectOptions,
  } = props;

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={submit}
      data-testid={TEST_IDS.COUNSELOR_PLAN.ENTRY_FORM}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Form.Item
          name="dayOfWeek"
          label="روز"
          rules={[{ required: true, message: "روز را انتخاب کنید" }]}
        >
          <Select
            placeholder="انتخاب روز"
            data-testid={TEST_IDS.FORM.SELECT("planDay")}
            options={DAYS_OF_WEEK.map((day) => ({
              value: day.day,
              label: day.label,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="subject"
          label="درس"
          rules={[{ required: true, message: "درس را انتخاب کنید" }]}
        >
          <Select
            allowClear
            placeholder="انتخاب درس"
            options={subjectOptions.map((option) => ({
              value: option.slug,
              label: option.label,
            }))}
            data-testid={TEST_IDS.FORM.SELECT("planSubject")}
          />
        </Form.Item>

        <Form.Item name="chapterIds" label="فصل‌ها">
          <Select
            mode="multiple"
            allowClear
            placeholder="انتخاب فصل‌ها"
            data-testid={TEST_IDS.COUNSELOR_PLAN.CHAPTERS}
            options={availableChapters.map((chapter) => ({
              value: chapter.id,
              label: `فصل ${persianDigits.format(chapter.number)}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="hours"
          label="ساعت"
          rules={[
            { required: true, message: "ساعت را وارد کنید" },
            { type: "number", min: 0.25, max: 12, message: "بین ۰٫۲۵ تا ۱۲" },
          ]}
        >
          <InputNumber
            min={0.25}
            max={12}
            step={0.25}
            dir="ltr"
            className="w-full"
            data-testid={TEST_IDS.FORM.INPUT("planHours")}
          />
        </Form.Item>
      </div>

      <Form.Item name="note" label="یادداشت">
        <Input.TextArea
          rows={2}
          maxLength={200}
          placeholder="یادداشت اختیاری (حداکثر ۲۰۰ کاراکتر)"
          data-testid={TEST_IDS.COUNSELOR_PLAN.NOTE}
        />
      </Form.Item>

      {saved ? (
        <p className="mb-2 text-sm text-teal-700" role="status">
          ردیف افزوده شد.
        </p>
      ) : null}

      {formError ? (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="primary"
        htmlType="submit"
        loading={pending}
        data-testid={TEST_IDS.FORM.SUBMIT("study-plan-entry")}
      >
        افزودن ردیف
      </Button>
    </Form>
  );
}
