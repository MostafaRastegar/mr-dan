import type { ReactNode } from "react";
import { Button, Form, InputNumber, type FormInstance } from "antd";

import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";

interface StudyPlanHeaderFormViewProps {
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  saved: boolean;
  initialValues: Record<string, unknown>;
}

export function StudyPlanHeaderFormView(
  props: StudyPlanHeaderFormViewProps,
): ReactNode {
  const { form, submit, pending, formError, saved, initialValues } = props;

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={submit}
      initialValues={initialValues}
      data-testid={TEST_IDS.COUNSELOR_PLAN.HEADER_FORM}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Form.Item
          name="testsTarget"
          label="هدف تست (تست)"
          rules={[
            { required: true, message: "هدف تست را وارد کنید" },
            { type: "number", min: 0, max: 2000, message: "بین ۰ تا ۲۰۰۰" },
          ]}
        >
          <InputNumber
            min={0}
            max={2000}
            dir="ltr"
            className="w-full"
            data-testid={TEST_IDS.COUNSELOR_PLAN.TESTS_TARGET}
          />
        </Form.Item>

        <Form.Item label=" " colon={false} className="mb-0 flex items-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("study-plan-header")}
          >
            ذخیره هدف تست
          </Button>
        </Form.Item>
      </div>

      {saved ? (
        <p className="mb-2 text-sm text-teal-700" role="status">
          هدف تست ذخیره شد.
        </p>
      ) : null}

      {formError ? (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}
    </Form>
  );
}
