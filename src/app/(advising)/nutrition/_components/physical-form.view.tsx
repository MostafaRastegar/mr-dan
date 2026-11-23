import type { ReactNode } from "react";
import { Button, Form, Input, Radio, Select, type FormInstance } from "antd";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import {
  ACTIVITY_LEVELS,
  AGE_RANGE,
  DIET_GOALS,
  GENDERS,
  HEIGHT_RANGE,
  WEIGHT_RANGE,
  type ActivityLevel,
  type DietGoal,
  type Gender,
} from "@/modules/advising/domain/energy";

import { TEST_IDS } from "@/constants/test-ids";

const GENDER_LABEL: Record<Gender, string> = { male: "مرد", female: "زن" };

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "کم‌تحرک",
  light: "سبک",
  moderate: "متوسط",
  active: "فعال",
  very_active: "خیلی فعال",
};

const DIET_GOAL_LABEL: Record<DietGoal, string> = {
  lose: "کاهش وزن",
  maintain: "حفظ وزن",
  gain: "افزایش وزن",
};

interface PhysicalFormViewProps {
  form: FormInstance;
  state: ActionState<{ saved: true }> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  initialValues: Record<string, unknown>;
}

export function PhysicalFormView(props: PhysicalFormViewProps): ReactNode {
  const { form, state, submit, pending, formError, initialValues } = props;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-xl font-bold">اطلاعات فیزیکی</h2>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.NUTRITION.FORM}
        initialValues={initialValues}
      >
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            name="age"
            label="سن (سال)"
            rules={[{ required: true, message: "سن را وارد کنید" }]}
          >
            <Input
              type="number"
              min={AGE_RANGE.min}
              max={AGE_RANGE.max}
              inputMode="numeric"
              dir="ltr"
              data-testid={TEST_IDS.FORM.INPUT("age")}
            />
          </Form.Item>

          <Form.Item
            name="gender"
            label="جنسیت"
            rules={[{ required: true, message: "جنسیت را انتخاب کنید" }]}
          >
            <Radio.Group data-testid={TEST_IDS.FORM.INPUT("gender")}>
              {GENDERS.map((value) => (
                <Radio key={value} value={value}>
                  {GENDER_LABEL[value]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="heightCm"
            label="قد (سانتی‌متر)"
            rules={[{ required: true, message: "قد را وارد کنید" }]}
          >
            <Input
              type="number"
              min={HEIGHT_RANGE.min}
              max={HEIGHT_RANGE.max}
              inputMode="numeric"
              dir="ltr"
              data-testid={TEST_IDS.FORM.INPUT("heightCm")}
            />
          </Form.Item>

          <Form.Item
            name="weightKg"
            label="وزن (کیلوگرم)"
            rules={[{ required: true, message: "وزن را وارد کنید" }]}
          >
            <Input
              type="number"
              min={WEIGHT_RANGE.min}
              max={WEIGHT_RANGE.max}
              inputMode="numeric"
              dir="ltr"
              data-testid={TEST_IDS.FORM.INPUT("weightKg")}
            />
          </Form.Item>

          <Form.Item
            name="activityLevel"
            label="سطح فعالیت"
            rules={[{ required: true, message: "سطح فعالیت را انتخاب کنید" }]}
          >
            <Select
              placeholder="انتخاب سطح فعالیت"
              data-testid={TEST_IDS.FORM.SELECT("activityLevel")}
            >
              {ACTIVITY_LEVELS.map((level) => (
                <Select.Option key={level} value={level}>
                  {ACTIVITY_LABEL[level]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dietGoal"
            label="هدف غذایی"
            rules={[{ required: true, message: "هدف غذایی را انتخاب کنید" }]}
          >
            <Radio.Group data-testid={TEST_IDS.FORM.INPUT("dietGoal")}>
              {DIET_GOALS.map((value) => (
                <Radio key={value} value={value}>
                  {DIET_GOAL_LABEL[value]}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </div>

        {state?.ok ? (
          <p
            className="mb-4 text-sm text-teal-700"
            role="status"
            data-testid={TEST_IDS.NUTRITION.SAVED}
          >
            اطلاعات فیزیکی ذخیره شد.
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
          data-testid={TEST_IDS.FORM.SUBMIT("physical-profile")}
        >
          ذخیرهٔ اطلاعات فیزیکی
        </Button>
      </Form>
    </div>
  );
}
