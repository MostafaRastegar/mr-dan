import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import { IconPlus } from "@tabler/icons-react";

import { TEST_IDS } from "@/constants/test-ids";

interface GroupCreateFormViewProps {
  form: FormInstance;
  submit: (values: Record<string, unknown>) => void;
  pending: boolean;
  formError: string | null;
  fieldOptions: string[];
  gradeOptions: string[];
}

export function GroupCreateFormView(props: GroupCreateFormViewProps): ReactNode {
  const { form, submit, pending, formError, fieldOptions, gradeOptions } =
    props;

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={submit}
      data-testid={TEST_IDS.ROSTER.CREATE_FORM}
    >
      <Form.Item
        name="name"
        label="نام گروه"
        rules={[{ required: true, message: "نام گروه را وارد کنید" }]}
      >
        <Input data-testid={TEST_IDS.FORM.INPUT("name")} />
      </Form.Item>

      <Form.Item name="description" label="توضیحات (اختیاری)">
        <Input data-testid={TEST_IDS.FORM.INPUT("description")} />
      </Form.Item>

      <div className="grid gap-3 sm:grid-cols-2">
        <Form.Item name="targetGrade" label="پایهٔ هدف (اختیاری)">
          <Select
            allowClear
            placeholder="انتخاب نشده"
            options={gradeOptions.map((grade) => ({ value: grade, label: grade }))}
            data-testid={TEST_IDS.FORM.SELECT("targetGrade")}
          />
        </Form.Item>

        <Form.Item name="targetField" label="رشتهٔ هدف (اختیاری)">
          <Select
            allowClear
            placeholder="انتخاب نشده"
            options={fieldOptions.map((field) => ({ value: field, label: field }))}
            data-testid={TEST_IDS.FORM.SELECT("targetField")}
          />
        </Form.Item>
      </div>

      {formError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <Form.Item className="mb-0">
        <Button
          type="primary"
          htmlType="submit"
          loading={pending}
          icon={<IconPlus size={16} />}
          data-testid={TEST_IDS.FORM.SUBMIT("create-group")}
        >
          ساخت گروه
        </Button>
      </Form.Item>
    </Form>
  );
}
