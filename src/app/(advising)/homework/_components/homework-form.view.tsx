import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import { FormSheet } from "@/app/_components/form-sheet";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import type { SubjectOption } from "@/modules/advising/domain/catalog";

import { TEST_IDS } from "@/constants/test-ids";

const PRIORITY_OPTIONS = [
  { value: "low", label: "کم" },
  { value: "medium", label: "متوسط" },
  { value: "high", label: "زیاد" },
];

interface HomeworkFormViewProps {
  open: boolean;
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  onClose: () => void;
  subjectOptions: SubjectOption[];
  initialValues: Record<string, unknown>;
}

export function HomeworkFormView(props: HomeworkFormViewProps): ReactNode {
  const {
    open,
    form,
    state,
    submit,
    pending,
    formError,
    onClose,
    subjectOptions,
    initialValues,
  } = props;

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="افزودن تکلیف"
      testId={TEST_IDS.HOMEWORK.FORM}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.HOMEWORK.FORM}
        initialValues={initialValues}
      >
        <Form.Item
          name="title"
          label="عنوان"
          rules={[{ required: true, message: "عنوان را وارد کنید" }]}
        >
          <Input
            data-testid={TEST_IDS.FORM.INPUT("title")}
          />
        </Form.Item>

        <Form.Item name="subject" label="درس (اختیاری)">
          <Select
            allowClear
            placeholder="انتخاب درس"
            data-testid={TEST_IDS.FORM.SELECT("subject")}
          >
            {subjectOptions.map((s) => (
              <Select.Option key={s.slug} value={s.slug}>
                {s.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="اولویت"
          rules={[{ required: true, message: "اولویت را انتخاب کنید" }]}
        >
          <Select
            placeholder="انتخاب اولویت"
            data-testid={TEST_IDS.FORM.SELECT("priority")}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <Select.Option key={p.value} value={p.value}>
                {p.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="deadline"
          label="تاریخ مهلت"
          rules={[{ required: true, message: "تاریخ مهلت را وارد کنید" }]}
        >
          <Input
            type="date"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("deadline")}
          />
        </Form.Item>

        {state?.ok ? (
          <p className="mb-4 text-sm text-teal-700" role="status" data-testid={TEST_IDS.HOMEWORK.SAVED}>
            تکلیف ذخیره شد.
          </p>
        ) : null}

        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <Form.Item className="mb-0 flex justify-end gap-2">
          <Button
            onClick={onClose}
            data-testid={TEST_IDS.FORM.CANCEL("homework")}
          >
            انصراف
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("homework")}
          >
            ذخیره
          </Button>
        </Form.Item>
      </Form>
    </FormSheet>
  );
}
