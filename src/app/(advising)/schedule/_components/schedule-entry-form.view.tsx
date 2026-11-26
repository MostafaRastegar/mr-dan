import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import { FormSheet } from "@/app/_components/form-sheet";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import { DAYS_OF_WEEK, type SubjectRow } from "@/modules/advising/domain/models";
import { subjectOptions } from "@/modules/advising/domain/catalog";

import { TEST_IDS } from "@/constants/test-ids";

interface ScheduleEntryFormViewProps {
  open: boolean;
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  onClose: () => void;
  fieldOfStudy: string | null;
  subjects: SubjectRow[];
  initialValues: Record<string, unknown>;
}

export function ScheduleEntryFormView(props: ScheduleEntryFormViewProps): ReactNode {
  const {
    open,
    form,
    state,
    submit,
    pending,
    formError,
    onClose,
    fieldOfStudy,
    subjects,
    initialValues,
  } = props;

  return (
    <FormSheet
      open={open}
      onClose={onClose}
      title="افزودن برنامه درسی"
      testId={TEST_IDS.SCHEDULE.CREATE_FORM}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.SCHEDULE.FORM}
        initialValues={initialValues}
      >
        <Form.Item
          name="dayOfWeek"
          label="روز هفته"
          rules={[{ required: true, message: "روز هفته را انتخاب کنید" }]}
        >
          <Select
            placeholder="انتخاب روز"
            data-testid={TEST_IDS.FORM.SELECT("dayOfWeek")}
          >
            {DAYS_OF_WEEK.map((day) => (
              <Select.Option key={day.day} value={day.day}>
                {day.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="startTime"
          label="زمان شروع"
          rules={[{ required: true, message: "زمان شروع را وارد کنید" }]}
        >
          <Input
            type="text"
            inputMode="numeric"
            placeholder="۰۸:۳۰"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("startTime")}
          />
        </Form.Item>

        <Form.Item
          name="endTime"
          label="زمان پایان"
          rules={[{ required: true, message: "زمان پایان را وارد کنید" }]}
        >
          <Input
            type="text"
            inputMode="numeric"
            placeholder="۰۸:۳۰"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("endTime")}
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
            data-testid={TEST_IDS.FORM.SELECT("subject")}
          >
            {subjectOptions(subjects, {
              field: fieldOfStudy,
              grade: null,
            }).map((s) => (
              <Select.Option key={s.slug} value={s.slug}>
                {s.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="teacher" label="معلم (اختیاری)">
          <Input
            placeholder="نام معلم"
            data-testid={TEST_IDS.FORM.INPUT("teacher")}
          />
        </Form.Item>

        <Form.Item name="room" label="اتاق (اختیاری)">
          <Input
            placeholder="شماره اتاق"
            data-testid={TEST_IDS.FORM.INPUT("room")}
          />
        </Form.Item>

        {state?.ok ? (
          <p className="mb-4 text-sm text-teal-700" role="status" data-testid={TEST_IDS.SCHEDULE.SAVED}>
            برنامه ذخیره شد.
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
            data-testid={TEST_IDS.FORM.CANCEL("schedule")}
          >
            انصراف
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("schedule")}
          >
            ذخیره
          </Button>
        </Form.Item>
      </Form>
    </FormSheet>
  );
}
