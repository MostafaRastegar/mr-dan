import type { ReactNode } from "react";
import { Button, Form, Input, type FormInstance } from "antd";

import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface FreeTimeFormViewProps {
  form: FormInstance;
  state: ActionState<{ dayKey: string; freeMinutes: number }> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  freeMinutes: number | null;
  suggestedMinutes: number;
  initialValues: Record<string, unknown>;
}

export function FreeTimeFormView(props: FreeTimeFormViewProps): ReactNode {
  const {
    form,
    state,
    submit,
    pending,
    formError,
    freeMinutes,
    suggestedMinutes,
    initialValues,
  } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-1 text-xl font-bold">وقت آزاد این روز</h2>
      <p className="mb-4 text-sm text-slate-600" data-testid={TEST_IDS.BUDGET.SUGGESTION}>
        پیشنهاد این روز: {formatClock(suggestedMinutes)}
        {freeMinutes === null
          ? " — هنوز ثبت نشده است"
          : ` — مقدار فعلی: ${formatClock(freeMinutes)}`}
      </p>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.BUDGET.FORM}
        initialValues={initialValues}
      >
        <Form.Item name="freeTime" label="وقت آزاد (ساعت:دقیقه)">
          <Input
            type="time"
            placeholder="مثلاً ۰۸:۳۰"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("freeTime")}
          />
        </Form.Item>

        <p className="mb-4 text-xs text-slate-500">
          خالی بگذارید تا پیشنهاد همین روز ذخیره شود.
        </p>

        {state?.ok ? (
          <p className="mb-4 text-sm text-teal-700" role="status">
            وقت آزاد ذخیره شد.
          </p>
        ) : null}

        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <Button
          type="primary"
          htmlType="submit"
          loading={pending}
          data-testid={TEST_IDS.FORM.SUBMIT("budget-free-time")}
        >
          ذخیرهٔ وقت آزاد
        </Button>
      </Form>
    </div>
  );
}
