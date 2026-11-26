import type { ReactNode } from "react";
import { Button, Form, InputNumber, type FormInstance } from "antd";
import { IconTargetArrow } from "@tabler/icons-react";

import { FormSheet } from "@/app/_components/form-sheet";
import { TEST_IDS } from "@/constants/test-ids";
import type { FormValues } from "@/utils/use-form-action";
import { formatNumber } from "@/modules/advising/presentation/planning-format";

interface StudyPlanHeaderFormViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  initialValues: Record<string, unknown>;
}

export function StudyPlanHeaderFormView(
  props: StudyPlanHeaderFormViewProps,
): ReactNode {
  const {
    open,
    onOpen,
    onClose,
    form,
    submit,
    pending,
    formError,
    initialValues,
  } = props;

  const testsTarget = Number(initialValues.testsTarget ?? 0);

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-600">
          <IconTargetArrow
            size={16}
            stroke={1.8}
            aria-hidden="true"
            className="me-1 inline align-[-3px]"
          />
          هدف تست هفته: <strong>{formatNumber(testsTarget)}</strong>
        </span>
        <Button onClick={onOpen} data-testid={TEST_IDS.COUNSELOR_PLAN.OPEN_HEADER_FORM}>
          ویرایش هدف
        </Button>
      </div>

      <FormSheet open={open} onClose={onClose} title="هدف تست هفته">
        <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        initialValues={initialValues}
        data-testid={TEST_IDS.COUNSELOR_PLAN.HEADER_FORM}
      >
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
          data-testid={TEST_IDS.FORM.SUBMIT("study-plan-header")}
        >
          ذخیره هدف تست
        </Button>
      </Form>
      </FormSheet>
    </>
  );
}
