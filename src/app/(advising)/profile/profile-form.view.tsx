import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";
import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import { FIELDS, GRADES, type ProfileView } from "@/modules/advising/domain/models";

import { TEST_IDS } from "@/constants/test-ids";

interface ProfileFormViewProps {
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  isStudent: boolean;
  initialValues: {
    fullName: string;
    email?: string;
    grade?: string;
    fieldOfStudy?: string;
    schoolName?: string;
  };
  profile: ProfileView;
}

export function ProfileFormView(props: ProfileFormViewProps): ReactNode {
  const {
    form,
    state,
    submit,
    pending,
    formError,
    isStudent,
    initialValues,
    profile,
  } = props;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">پروفایل</h1>
        <p className="text-sm text-slate-600" dir="ltr">
          {profile.username}
        </p>
      </div>

      {profile.role === "student" ? (
        <dl className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">گروه</dt>
            <dd>{profile.groupName ?? "بدون گروه"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">مشاور</dt>
            <dd>{profile.counselorName ?? "تعیین نشده"}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-slate-600">نقش شما: مشاور</p>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={submit}
          data-testid={TEST_IDS.PROFILE.FORM}
          initialValues={initialValues}
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

          <Form.Item name="email" label="ایمیل (اختیاری)">
            <Input
              type="email"
              dir="ltr"
              autoComplete="email"
              data-testid={TEST_IDS.FORM.INPUT("email")}
            />
          </Form.Item>

          {isStudent ? (
            <>
              <Form.Item name="grade" label="پایهٔ تحصیلی">
                <Select
                  allowClear
                  placeholder="انتخاب نشده"
                  options={GRADES.map((grade) => ({ value: grade, label: grade }))}
                  data-testid={TEST_IDS.FORM.SELECT("grade")}
                />
              </Form.Item>

              <Form.Item name="fieldOfStudy" label="رشتهٔ تحصیلی">
                <Select
                  allowClear
                  placeholder="انتخاب نشده"
                  options={FIELDS.map((field) => ({ value: field, label: field }))}
                  data-testid={TEST_IDS.FORM.SELECT("fieldOfStudy")}
                />
              </Form.Item>

              <Form.Item name="schoolName" label="نام مدرسه">
                <Input data-testid={TEST_IDS.FORM.INPUT("schoolName")} />
              </Form.Item>
            </>
          ) : null}

          <fieldset className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
            <legend className="px-1 text-sm text-slate-700">
              تغییر رمز عبور (اختیاری)
            </legend>

            <Form.Item name="currentPassword" label="رمز عبور فعلی" className="mb-0">
              <Input.Password
                autoComplete="current-password"
                dir="ltr"
                data-testid={TEST_IDS.FORM.INPUT("currentPassword")}
              />
            </Form.Item>

            <Form.Item name="newPassword" label="رمز عبور جدید" className="mb-0">
              <Input.Password
                autoComplete="new-password"
                dir="ltr"
                data-testid={TEST_IDS.FORM.INPUT("newPassword")}
              />
            </Form.Item>
          </fieldset>

          {state?.ok ? (
            <p className="mb-4 text-sm text-teal-700" role="status" data-testid={TEST_IDS.PROFILE.SAVED}>
              پروفایل ذخیره شد.
            </p>
          ) : null}

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
              data-testid={TEST_IDS.FORM.SUBMIT("profile")}
            >
              ذخیرهٔ پروفایل
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
