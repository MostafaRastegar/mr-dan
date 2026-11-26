import type { ReactNode } from "react";
import { Button, Form, Input, type FormInstance } from "antd";
import Link from "next/link";

import { TEST_IDS } from "@/constants/test-ids";

interface LoginFormViewProps {
  form: FormInstance;
  submit: (values: Record<string, unknown>) => void;
  pending: boolean;
  formError: string | null;
}

export function LoginFormView(props: LoginFormViewProps): ReactNode {
  const { form, submit, pending, formError } = props;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-bold">ورود به mr-dan</h1>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.AUTH.LOGIN_FORM}
      >
        <Form.Item
          name="username"
          label="نام کاربری"
          rules={[{ required: true, message: "نام کاربری را وارد کنید" }]}
        >
          <Input
            autoComplete="username"
            dir="ltr"
            spellCheck={false}
            data-testid={TEST_IDS.FORM.INPUT("username")}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="رمز عبور"
          rules={[{ required: true, message: "رمز عبور را وارد کنید" }]}
        >
          <Input.Password
            autoComplete="current-password"
            dir="ltr"
            data-testid={TEST_IDS.FORM.INPUT("password")}
          />
        </Form.Item>

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
            data-testid={TEST_IDS.FORM.SUBMIT("login")}
          >
            ورود
          </Button>
        </Form.Item>

        <p className="text-center text-sm text-slate-600">
          حساب ندارید؟{" "}
          <Link
            href="/register"
            className="text-teal-700 underline"
            data-testid={TEST_IDS.AUTH.REGISTER_LINK}
          >
            ثبت‌نام
          </Link>
        </p>
      </Form>
      <Link href="/" className="text-center text-sm text-slate-600 underline">
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
