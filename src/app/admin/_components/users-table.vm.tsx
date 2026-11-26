"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import type { AdminUserRow, Page, Role } from "@/modules/advising/domain/models";
import type { ActionState } from "@/utils/app-error";
import {
  useActionMutation,
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";

import {
  changeUserRoleAction,
  resetUserCredentialsAction,
  updateUserContactAction,
} from "../users/users.actions";
import { UsersTableView } from "./users-table.view";

interface UsersTableWrapperProps {
  page: Page<AdminUserRow>;
  basePath: string;
  canManageRole: boolean;
  canSupport: boolean;
  readFailed?: boolean;
}

type RoleTarget = { userId: string; username: string; role: Role };

export function UsersTableWrapper(
  props: UsersTableWrapperProps,
): React.ReactNode {
  const {
    page,
    basePath,
    canManageRole,
    canSupport,
    readFailed = false,
  } = props;
  const router = useRouter();
  const [form] = Form.useForm();
  const [roleTarget, setRoleTarget] = useState<RoleTarget | null>(null);
  const [editTarget, setEditTarget] = useState<AdminUserRow | null>(null);
  const [navigating, startNavigation] = useTransition();

  const roleChange = useActionMutation(changeUserRoleAction);
  const support = useFormAction(updateUserContactAction);
  const reset = useActionMutation(resetUserCredentialsAction);
  const supportError = useServerFormErrors(support.state, form);

  useEffect(() => {
    if (!support.state?.ok) return;
    setEditTarget(null);
    form.resetFields();
    router.refresh();
  }, [support.state, form, router]);

  useEffect(() => {
    if (!roleChange.state?.ok) return;
    router.refresh();
  }, [roleChange.state, router]);

  const openRole = (row: AdminUserRow, role: Role) => {
    if (role === row.role) return;
    setRoleTarget({ userId: row.id, username: row.username, role });
  };

  const confirmRole = () => {
    if (roleTarget) {
      roleChange.run({ userId: roleTarget.userId, role: roleTarget.role });
    }
    setRoleTarget(null);
  };

  const openEdit = (row: AdminUserRow) => {
    setEditTarget(row);
    form.setFieldsValue({ fullName: row.fullName, email: row.email ?? "" });
  };

  const submitEdit = (values: FormValues) => {
    if (editTarget) support.submit({ ...values, userId: editTarget.id });
  };

  const successMessage = roleChange.state?.ok
    ? "نقش کاربر تغییر کرد."
    : support.state?.ok
      ? "اطلاعات کاربر ذخیره شد."
      : reset.state?.ok
        ? "اعتبار کاربر بازنشانی شد."
        : null;

  const errorMessage =
    mutationError(roleChange.state) ??
    mutationError(support.state) ??
    mutationError(reset.state);

  return (
    <UsersTableView
      rows={page.items}
      total={page.total}
      currentPage={page.page}
      pageSize={page.pageSize}
      loading={navigating}
      onPageChange={(next) =>
        startNavigation(() => router.push(`${basePath}?page=${next}`))
      }
      readFailed={readFailed}
      canManageRole={canManageRole}
      canSupport={canSupport}
      roleTarget={roleTarget}
      onOpenRole={openRole}
      onConfirmRole={confirmRole}
      onCancelRole={() => setRoleTarget(null)}
      rolePending={roleChange.pending}
      editTarget={editTarget}
      form={form}
      supportError={supportError}
      supportPending={support.pending}
      onSubmitEdit={submitEdit}
      onOpenEdit={openEdit}
      onCloseEdit={() => setEditTarget(null)}
      onReset={(userId) => reset.run({ userId })}
      resetPending={reset.pending}
      temporaryPassword={
        reset.state?.ok ? reset.state.data.temporaryPassword : null
      }
      successMessage={successMessage}
      errorMessage={errorMessage}
    />
  );
}

function mutationError(state: ActionState<unknown> | null): string | null {
  return state && !state.ok ? state.error.message : null;
}
