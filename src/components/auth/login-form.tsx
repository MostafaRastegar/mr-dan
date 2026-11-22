"use client";

import { useActionState } from "react";
import { Button, Input } from "antd";
import Link from "next/link";

import { loginAction } from "@/server/advising-actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const errors = state && !state.ok ? state.error.fieldErrors ?? {} : {};

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">نام کاربری</span>
        <Input
          name="username"
          autoComplete="username"
          dir="ltr"
          status={errors.username ? "error" : undefined}
        />
        {errors.username ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.username}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">رمز عبور</span>
        <Input.Password
          name="password"
          autoComplete="current-password"
          dir="ltr"
          status={errors.password ? "error" : undefined}
        />
        {errors.password ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.password}
          </span>
        ) : null}
      </label>

      {state && !state.ok ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error.message}
        </p>
      ) : null}

      <Button type="primary" htmlType="submit" loading={pending} block>
        ورود
      </Button>

      <p className="text-center text-sm text-slate-600">
        حساب ندارید؟{" "}
        <Link href="/register" className="text-teal-700 underline">
          ثبت‌نام
        </Link>
      </p>
    </form>
  );
}
