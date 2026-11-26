import type { ReactNode } from "react";
import { Button, Form, Select, TimePicker, type FormInstance } from "antd";
import { FormSheet } from "@/app/_components/form-sheet";

import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import type { PlanCandidate } from "@/modules/advising/application/free-time";
import { formatDeadline } from "@/modules/advising/presentation/planning-format";
import { TEST_IDS } from "@/constants/test-ids";

interface PlanFormViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  form: FormInstance;
  state: ActionState<{
    homeworkId: string;
    dayKey: string;
    plannedMinutes: number;
  }> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  candidates: PlanCandidate[];
}

export function PlanFormView(props: PlanFormViewProps): ReactNode {
  const { open, onOpen, onClose, form, state, submit, pending, formError, candidates } = props;

  if (candidates.length === 0) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">برنامه‌ریزی زمان تکلیف</h2>
        <p className="mt-2 text-sm text-slate-600">
          تکلیف بازی برای برنامه‌ریزی در این روز نیست.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">برنامه‌ریزی زمان تکلیف</h2>
        <Button onClick={onOpen} data-testid={TEST_IDS.BUDGET.PLAN_OPEN_FORM}>
          افزودن برنامه
        </Button>
      </div>

      <FormSheet
        open={open}
        onClose={onClose}
        title="افزودن برنامه"
        testId={TEST_IDS.BUDGET.PLAN_FORM}
      >
        <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.BUDGET.PLAN_FORM}
      >
        <Form.Item
          name="homeworkId"
          label="تکلیف"
          rules={[{ required: true, message: "تکلیف را انتخاب کنید" }]}
        >
          <Select
            placeholder="انتخاب تکلیف"
            data-testid={TEST_IDS.FORM.SELECT("homeworkId")}
          >
            {candidates.map((candidate) => (
              <Select.Option key={candidate.id} value={candidate.id}>
                {`${candidate.title} — مهلت: ${formatDeadline(candidate.deadline)}`}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="plannedTime"
          label="زمان برنامه‌ریزی‌شده (ساعت:دقیقه)"
          rules={[{ required: true, message: "زمان برنامه‌ریزی را انتخاب کنید" }]}
        >
          <TimePicker
            format="HH:mm"
            minuteStep={5}
            placeholder="مثلاً ۰۱:۳۰"
            data-testid={TEST_IDS.FORM.INPUT("plannedTime")}
          />
        </Form.Item>

        {state?.ok ? (
          <p className="mb-4 text-sm text-teal-700" role="status">
            برنامه ذخیره شد.
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
          block
          data-testid={TEST_IDS.FORM.SUBMIT("budget-plan")}
        >
          ثبت برنامه
        </Button>
      </Form>
      </FormSheet>
    </section>
  );
}
