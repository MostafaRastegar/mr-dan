import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { FIELD_CONFIG } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createFieldAction,
  reactivateFieldAction,
  retireFieldAction,
  updateFieldAction,
} from "./fields.actions";

export default async function AdminFieldsPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.fields.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={FIELD_CONFIG}
      page={data}
      basePath="/admin/catalog/fields"
      readFailed={readFailed}
      actions={{
        create: createFieldAction,
        update: updateFieldAction,
        retire: retireFieldAction,
        reactivate: reactivateFieldAction,
      }}
    />
  );
}
