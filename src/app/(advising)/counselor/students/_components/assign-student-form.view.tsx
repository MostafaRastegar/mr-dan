import type { ReactNode } from "react";
import { Button, Form, Select, type FormInstance } from "antd";

import { TEST_IDS } from "@/constants/test-ids";
import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";
import type { ActionState } from "@/utils/app-error";

interface AssignStudentFormViewProps {
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: Record<string, unknown>) => void;
  pending: boolean;
  formError: string | null;
  groups: GroupSummary[];
  students: StudentSummary[];
}

export function AssignStudentFormView(props: AssignStudentFormViewProps): ReactNode {
  const {
    form,
    state,
    submit,
    pending,
    formError,
    groups,
    students,
  } = props;

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={submit}
      data-testid={TEST_IDS.ROSTER.ASSIGN_FORM}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Form.Item
          name="studentId"
          label="دانش‌آموز"
          rules={[{ required: true, message: "دانش‌آموز را انتخاب کنید" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="انتخاب کنید"
            options={students.map((student) => ({
              value: student.id,
              label: `${student.fullName} (${student.username})`,
            }))}
            data-testid={TEST_IDS.FORM.SELECT("studentId")}
          />
        </Form.Item>

        <Form.Item name="groupId" label="گروه">
          <Select
            allowClear
            placeholder="بدون گروه"
            options={groups.map((group) => ({
              value: group.id,
              label: group.name,
            }))}
            data-testid={TEST_IDS.FORM.SELECT("groupId")}
          />
        </Form.Item>

        <Form.Item label=" " colon={false} className="mb-0">
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            data-testid={TEST_IDS.FORM.SUBMIT("assign")}
          >
            تخصیص
          </Button>
        </Form.Item>
      </div>

      {state?.ok ? (
        <p className="text-sm text-teal-700" role="status" data-testid={TEST_IDS.ROSTER.ASSIGNED}>
          تخصیص انجام شد.
        </p>
      ) : null}

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}
    </Form>
  );
}
