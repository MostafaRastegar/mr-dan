"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";

import type { Page } from "@/modules/advising/domain/models";
import type { ActionState } from "@/utils/app-error";
import {
  useActionMutation,
  useFormAction,
  useServerFormErrors,
  type FormValues,
} from "@/utils/use-form-action";

import { CatalogManagerView } from "./catalog-manager.view";
import type {
  CatalogActions,
  CatalogConfig,
  CatalogFieldSpec,
  CatalogRow,
} from "./catalog-types";

interface CatalogManagerWrapperProps<T extends CatalogRow> {
  config: CatalogConfig;
  page: Page<T>;
  basePath: string;
  actions: CatalogActions;
  readFailed?: boolean;
}

export function CatalogManagerWrapper<T extends CatalogRow>(
  props: CatalogManagerWrapperProps<T>,
): React.ReactNode {
  const { config, page, basePath, actions, readFailed = false } = props;
  const router = useRouter();
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [navigating, startNavigation] = useTransition();

  const create = useFormAction(actions.create);
  const update = useFormAction(actions.update);
  const retire = useActionMutation(actions.retire);
  const reactivate = useActionMutation(actions.reactivate);
  const createError = useServerFormErrors(create.state, form);
  const updateError = useServerFormErrors(update.state, form);

  useEffect(() => {
    if (!create.state?.ok) return;
    form.resetFields();
    setEditingId(null);
    setIsFormOpen(false);
    router.refresh();
  }, [create.state, form, router]);

  useEffect(() => {
    if (!update.state?.ok) return;
    form.resetFields();
    setEditingId(null);
    setIsFormOpen(false);
    router.refresh();
  }, [update.state, form, router]);

  useEffect(() => {
    if (!retire.state?.ok) return;
    router.refresh();
  }, [retire.state, router]);

  useEffect(() => {
    if (!reactivate.state?.ok) return;
    router.refresh();
  }, [reactivate.state, router]);

  const startEdit = (row: T) => {
    setEditingId(row.id);
    form.setFieldsValue(readFormValues(row, config.fields));
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.resetFields();
    setIsFormOpen(false);
  };

  const submit = (values: FormValues) => {
    if (editingId) update.submit({ ...values, id: editingId });
    else create.submit(values);
  };

  const goToPage = (nextPage: number) => {
    startNavigation(() => router.push(`${basePath}?page=${nextPage}`));
  };

  return (
    <CatalogManagerView
      form={form}
      config={config}
      isFormOpen={isFormOpen}
      onOpenCreate={() => setIsFormOpen(true)}
      rows={page.items}
      total={page.total}
      currentPage={page.page}
      pageSize={page.pageSize}
      loading={navigating}
      onPageChange={goToPage}
      readFailed={readFailed}
      submit={submit}
      pending={create.pending || update.pending}
      formError={editingId ? updateError : createError}
      editingId={editingId}
      onEdit={startEdit}
      onCancelEdit={cancelEdit}
      onRetire={(row) =>
        row.active ? retire.run({ id: row.id }) : reactivate.run({ id: row.id })
      }
      retirePending={retire.pending || reactivate.pending}
      saved={Boolean(
        create.state?.ok ||
          update.state?.ok ||
          retire.state?.ok ||
          reactivate.state?.ok,
      )}
      mutationError={
        stateError(retire.state) ?? stateError(reactivate.state)
      }
    />
  );
}

function stateError(state: ActionState<unknown> | null): string | null {
  return state && !state.ok ? state.error.message : null;
}

function readFormValues(
  row: CatalogRow,
  fields: CatalogFieldSpec[],
): Record<string, unknown> {
  const source = row as unknown as Record<string, unknown>;
  return Object.fromEntries(
    fields.map((field) => [field.name, source[field.name]]),
  );
}
