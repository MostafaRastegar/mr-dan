import type { ReactNode } from "react";
import { Button, Form, Select, type FormInstance } from "antd";

import { FormSheet } from "@/app/_components/form-sheet";
import { TEST_IDS } from "@/constants/test-ids";
import type { GroupSummary, StudentSummary } from "@/modules/advising/domain/models";

interface AssignStudentFormViewProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  form: FormInstance;
  submit: (values: Record<string, unknown>) => void;
  pending: boolean;
  formError: string | null;
  groups: GroupSummary[];
  students: StudentSummary[];
}

export function AssignStudentFormView(props: AssignStudentFormViewProps): ReactNode {
  const {
    open,
    onOpen,
    onClose,
    form,
    submit,
    pending,
    formError,
    groups,
    students,
  } = props;

  return (
    <>
      <Button onClick={onOpen} data-testid={TEST_IDS.ROSTER.OPEN_ASSIGN_FORM}>
        تخصیص دانش‌آموز
      </Button>

      <FormSheet open={open} onClose={onClose} title="تخصیص دانش‌آموز به گروه">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          data-testid={TEST_IDS.ROSTER.ASSIGN_FORM}
        >
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
            data-testid={TEST_IDS.FORM.SUBMIT("assign")}
          >
            تخصیص
          </Button>
        </Form>
      </FormSheet>
    </>
  );
}
