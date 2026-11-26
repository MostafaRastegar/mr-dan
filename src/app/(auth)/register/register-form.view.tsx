import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import Link from "next/link";
import type { FormValues } from "@/utils/use-form-action";

import { TEST_IDS } from "@/constants/test-ids";

const ROLE_OPTIONS = [
  { value: "student", label: "دانش‌آموز" },
  { value: "counselor", label: "مشاور" },
];

interface RegisterFormViewProps {
  form: FormInstance;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  isStudent: boolean;
  initialValues: { role: string };
  fieldOptions: string[];
  gradeOptions: string[];
}

export function RegisterFormView(props: RegisterFormViewProps): ReactNode {
  const {
    form,
    submit,
    pending,
    formError,
    isStudent,
    initialValues,
    fieldOptions,
    gradeOptions,
  } = props;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
      <h1 className="text-2xl font-bold">ثبت‌نام در mr-dan</h1>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        initialValues={initialValues}
        data-testid={TEST_IDS.AUTH.REGISTER_FORM}
      >
        <Form.Item
          name="fullName"
          label="نام و نام خانوادگی"
          rules={[{ required: true, message: "نام و نام خانوادگی را وارد کنید" }]}
        >
          <Input
            autoComplete="name"
            data-testid={TEST_IDS.FORM.INPUT("fullName")}
          />
        </Form.Item>

        <Form.Item
          name="username"
          label="نام کاربری"
          rules={[
            { required: true, message: "نام کاربری را وارد کنید" },
            { min: 3, message: "نام کاربری باید حداقل ۳ نویسه باشد" },
          ]}
        >
          <Input
            autoComplete="username"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("username")}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="رمز عبور (حداقل ۸ نویسه)"
          rules={[
            { required: true, message: "رمز عبور را وارد کنید" },
            { min: 8, message: "رمز عبور باید حداقل ۸ نویسه باشد" },
          ]}
        >
          <Input.Password
            autoComplete="new-password"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("password")}
          />
        </Form.Item>

        <Form.Item name="email" label="ایمیل (اختیاری)">
          <Input
            type="email"
            autoComplete="email"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("email")}
          />
        </Form.Item>

        <Form.Item name="role" label="نقش">
          <Select
            options={ROLE_OPTIONS}
            data-testid={TEST_IDS.FORM.SELECT("role")}
          />
        </Form.Item>

        {isStudent ? (
          <>
            <Form.Item name="grade" label="پایهٔ تحصیلی (اختیاری)">
              <Select
                allowClear
                placeholder="انتخاب نشده"
                options={gradeOptions.map((grade) => ({ value: grade, label: grade }))}
                data-testid={TEST_IDS.FORM.SELECT("grade")}
              />
            </Form.Item>

            <Form.Item name="fieldOfStudy" label="رشتهٔ تحصیلی (اختیاری)">
              <Select
                allowClear
                placeholder="انتخاب نشده"
                options={fieldOptions.map((field) => ({ value: field, label: field }))}
                data-testid={TEST_IDS.FORM.SELECT("fieldOfStudy")}
              />
            </Form.Item>

            <Form.Item name="schoolName" label="نام مدرسه (اختیاری)">
              <Input data-testid={TEST_IDS.FORM.INPUT("schoolName")} />
            </Form.Item>
          </>
        ) : null}

        {formError ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <Form.Item className="mb-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={pending}
            block
            data-testid={TEST_IDS.FORM.SUBMIT("register")}
          >
            ثبت‌نام
          </Button>
        </Form.Item>

        <p className="text-center text-sm text-slate-600">
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link
            href="/login"
            className="text-teal-700 underline"
            data-testid={TEST_IDS.AUTH.LOGIN_LINK}
          >
            ورود
          </Link>
        </p>
      </Form>
      <Link href="/" className="text-center text-sm text-slate-600 underline">
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
