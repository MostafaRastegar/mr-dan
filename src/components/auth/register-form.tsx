"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "antd";
import Link from "next/link";

import { FIELDS, GRADES } from "@/modules/advising/domain/models";
import { registerAction } from "@/server/advising-actions";

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);
  const [role, setRole] = useState("student");
  const errors = state && !state.ok ? state.error.fieldErrors ?? {} : {};
  const isStudent = role === "student";

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">نام و نام خانوادگی</span>
        <Input
          name="fullName"
          autoComplete="name"
          status={errors.fullName ? "error" : undefined}
        />
        {errors.fullName ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.fullName}
          </span>
        ) : null}
      </label>

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
        <span className="text-sm text-slate-700">رمز عبور (حداقل ۸ نویسه)</span>
        <Input.Password
          name="password"
          autoComplete="new-password"
          dir="ltr"
          status={errors.password ? "error" : undefined}
        />
        {errors.password ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.password}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">ایمیل (اختیاری)</span>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          status={errors.email ? "error" : undefined}
        />
        {errors.email ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.email}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">نقش</span>
        <select
          name="role"
          className={selectClass}
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="student">دانش‌آموز</option>
          <option value="counselor">مشاور</option>
        </select>
      </label>

      {isStudent ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">پایهٔ تحصیلی (اختیاری)</span>
            <select name="grade" className={selectClass} defaultValue="">
              <option value="">انتخاب نشده</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">رشتهٔ تحصیلی (اختیاری)</span>
            <select name="fieldOfStudy" className={selectClass} defaultValue="">
              <option value="">انتخاب نشده</option>
              {FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">نام مدرسه (اختیاری)</span>
            <Input name="schoolName" status={errors.schoolName ? "error" : undefined} />
            {errors.schoolName ? (
              <span className="text-xs text-red-600" role="alert">
                {errors.schoolName}
              </span>
            ) : null}
          </label>
        </>
      ) : null}

      {state && !state.ok ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error.message}
        </p>
      ) : null}

      <Button type="primary" htmlType="submit" loading={pending} block>
        ثبت‌نام
      </Button>

      <p className="text-center text-sm text-slate-600">
        قبلاً ثبت‌نام کرده‌اید؟{" "}
        <Link href="/login" className="text-teal-700 underline">
          ورود
        </Link>
      </p>
    </form>
  );
}
