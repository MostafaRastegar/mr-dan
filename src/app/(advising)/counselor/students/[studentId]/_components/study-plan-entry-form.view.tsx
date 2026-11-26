import type { ReactNode } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  type FormInstance,
} from "antd";
import { IconPlus } from "@tabler/icons-react";

import { FormSheet } from "@/app/_components/form-sheet";
import { DAYS_OF_WEEK } from "@/modules/advising/domain/models";
import type { Chapter } from "@/modules/advising/domain/models";
import type { SubjectOption } from "@/modules/advising/domain/catalog";
import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";

const persianDigits = new Intl.NumberFormat("fa-IR", { useGrouping: false });

interface StudyPlanEntryFormViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  availableChapters: Chapter[];
  subjectOptions: SubjectOption[];
}

export function StudyPlanEntryFormView(
  props: StudyPlanEntryFormViewProps,
): ReactNode {
  const {
    open,
    onOpen,
    onClose,
    form,
    submit,
    pending,
    formError,
    availableChapters,
    subjectOptions,
  } = props;

  return (
    <>
      <Button
        icon={<IconPlus size={16} stroke={2} aria-hidden="true" />}
        onClick={onOpen}
        data-testid={TEST_IDS.COUNSELOR_PLAN.OPEN_ENTRY_FORM}
      >
        افزودن ردیف
      </Button>

      <FormSheet open={open} onClose={onClose} title="افزودن ردیف برنامه">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          data-testid={TEST_IDS.COUNSELOR_PLAN.ENTRY_FORM}
        >
      <div className="grid gap-3">
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

      {formError ? (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="primary"
        htmlType="submit"
        loading={pending}
        block
        data-testid={TEST_IDS.FORM.SUBMIT("study-plan-entry")}
      >
        افزودن ردیف
      </Button>
    </Form>
      </FormSheet>
    </>
  );
}
