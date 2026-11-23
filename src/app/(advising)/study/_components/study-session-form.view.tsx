import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import { STUDY_CATEGORIES } from "@/modules/advising/domain/models";
import { subjectsForField } from "@/modules/advising/domain/subjects";

import { TEST_IDS } from "@/constants/test-ids";

const CATEGORY_LABELS: Record<string, string> = {
  study: "مطالعه",
  break: "استراحت",
  waste: "ضیعت",
};

interface StudySessionFormViewProps {
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  initialValues: Record<string, unknown>;
}

export function StudySessionFormView(props: StudySessionFormViewProps): ReactNode {
  const {
    form,
    state,
    submit,
    pending,
    formError,
    initialValues,
  } = props;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">ثبت جلسه مطالعه</h2>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.STUDY.FORM}
        initialValues={initialValues}
      >
        <Form.Item
          name="category"
          label="دسته‌بندی"
          rules={[{ required: true, message: "دسته‌بندی را انتخاب کنید" }]}
        >
          <Select
            placeholder="انتخاب دسته‌بندی"
            data-testid={TEST_IDS.FORM.SELECT("category")}
          >
            {STUDY_CATEGORIES.map((c) => (
              <Select.Option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="durationMinutes"
          label="مدت (دقیقه)"
          rules={[{ required: true, message: "مدت را وارد کنید" }]}
        >
          <Input
            type="number"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("durationMinutes")}
          />
        </Form.Item>

        <Form.Item name="focusLevel" label="سطح تمرکز (۱ تا ۵، اختیاری)">
          <Input
            type="number"
            min="1"
            max="5"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("focusLevel")}
          />
        </Form.Item>

        <Form.Item name="subject" label="درس (اختیاری)">
          <Select
            allowClear
            placeholder="انتخاب درس"
            data-testid={TEST_IDS.FORM.SELECT("subject")}
          >
            {subjectsForField(null).map((s) => (
              <Select.Option key={s.slug} value={s.slug}>
                {s.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="startedAt"
          label="زمان شروع"
          rules={[{ required: true, message: "زمان شروع را وارد کنید" }]}
        >
          <Input
            type="text"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("startedAt")}
          />
        </Form.Item>

        {state?.ok ? (
          <p className="mb-4 text-sm text-teal-700" role="status" data-testid={TEST_IDS.STUDY.SAVED}>
            جلسه ثبت شد.
          </p>
        ) : null}

        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <Form.Item className="mb-0 flex justify-end gap-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("study")}
          >
            ثبت
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
