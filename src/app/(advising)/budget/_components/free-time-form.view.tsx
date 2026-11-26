import type { ReactNode } from "react";
import { Button, Form, Input, type FormInstance } from "antd";
import { FormSheet } from "@/app/_components/form-sheet";

import type { FormValues } from "@/utils/use-form-action";
import { formatClock } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface FreeTimeFormViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  freeMinutes: number | null;
  suggestedMinutes: number;
  initialValues: Record<string, unknown>;
}

export function FreeTimeFormView(props: FreeTimeFormViewProps): ReactNode {
  const {
    open,
    onOpen,
    onClose,
    form,
    submit,
    pending,
    formError,
    freeMinutes,
    suggestedMinutes,
    initialValues,
  } = props;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">وقت آزاد این روز</h2>
        <Button
          onClick={onOpen}
          data-testid={TEST_IDS.BUDGET.OPEN_FORM}
        >
          ثبت وقت آزاد
        </Button>
      </div>
      <p className="mb-2 text-sm text-slate-600" data-testid={TEST_IDS.BUDGET.SUGGESTION}>
        پیشنهاد این روز: {formatClock(suggestedMinutes)}
        {freeMinutes === null
          ? " — هنوز ثبت نشده است"
          : ` — مقدار فعلی: ${formatClock(freeMinutes)}`}
      </p>

      <FormSheet
        open={open}
        onClose={onClose}
        title="ثبت وقت آزاد"
        testId={TEST_IDS.BUDGET.FORM}
      >
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

          {formError ? (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {formError}
            </p>
          ) : null}

          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            block
            data-testid={TEST_IDS.FORM.SUBMIT("budget-free-time")}
          >
            ذخیرهٔ وقت آزاد
          </Button>
        </Form>
      </FormSheet>
    </section>
  );
}
