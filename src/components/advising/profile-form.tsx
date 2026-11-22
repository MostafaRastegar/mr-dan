"use client";

import { useActionState } from "react";
import { Button, Input } from "antd";

import {
  FIELDS,
  GRADES,
  type ProfileView,
} from "@/modules/advising/domain/models";
import { updateProfileAction } from "@/server/advising-actions";

const selectClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none";

export default function ProfileForm({ profile }: { profile: ProfileView }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const errors = state && !state.ok ? state.error.fieldErrors ?? {} : {};
  const isStudent = profile.role === "student";

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm text-slate-700">نام و نام خانوادگی</span>
        <Input
          name="fullName"
          defaultValue={profile.fullName}
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
        <span className="text-sm text-slate-700">ایمیل (اختیاری)</span>
        <Input
          name="email"
          type="email"
          dir="ltr"
          defaultValue={profile.email ?? ""}
          autoComplete="email"
          status={errors.email ? "error" : undefined}
        />
        {errors.email ? (
          <span className="text-xs text-red-600" role="alert">
            {errors.email}
          </span>
        ) : null}
      </label>

      {isStudent ? (
        <>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">پایهٔ تحصیلی</span>
            <select
              name="grade"
              className={selectClass}
              defaultValue={profile.grade ?? ""}
            >
              <option value="">انتخاب نشده</option>
              {GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">رشتهٔ تحصیلی</span>
            <select
              name="fieldOfStudy"
              className={selectClass}
              defaultValue={profile.fieldOfStudy ?? ""}
            >
              <option value="">انتخاب نشده</option>
              {FIELDS.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-700">نام مدرسه</span>
            <Input
              name="schoolName"
              defaultValue={profile.schoolName ?? ""}
              status={errors.schoolName ? "error" : undefined}
            />
            {errors.schoolName ? (
              <span className="text-xs text-red-600" role="alert">
                {errors.schoolName}
              </span>
            ) : null}
          </label>
        </>
      ) : null}

      <fieldset className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
        <legend className="px-1 text-sm text-slate-700">تغییر رمز عبور (اختیاری)</legend>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-700">رمز عبور فعلی</span>
          <Input.Password
            name="currentPassword"
            autoComplete="current-password"
            dir="ltr"
            status={errors.currentPassword ? "error" : undefined}
          />
          {errors.currentPassword ? (
            <span className="text-xs text-red-600" role="alert">
              {errors.currentPassword}
            </span>
          ) : null}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-700">رمز عبور جدید</span>
          <Input.Password
            name="newPassword"
            autoComplete="new-password"
            dir="ltr"
            status={errors.newPassword ? "error" : undefined}
          />
          {errors.newPassword ? (
            <span className="text-xs text-red-600" role="alert">
              {errors.newPassword}
            </span>
          ) : null}
        </label>
      </fieldset>

      {state?.ok ? (
        <p className="text-sm text-teal-700" role="status">
          پروفایل ذخیره شد.
        </p>
      ) : null}

      {state && !state.ok ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error.message}
        </p>
      ) : null}

      <Button type="primary" htmlType="submit" loading={pending}>
        ذخیرهٔ پروفایل
      </Button>
    </form>
  );
}
