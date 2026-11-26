import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { NEED_CONFIG } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createNeedAction,
  reactivateNeedAction,
  retireNeedAction,
  updateNeedAction,
} from "./needs.actions";

export default async function AdminNeedsPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.needs.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={NEED_CONFIG}
      page={data}
      basePath="/admin/catalog/needs"
      readFailed={readFailed}
      actions={{
        create: createNeedAction,
        update: updateNeedAction,
        retire: retireNeedAction,
        reactivate: reactivateNeedAction,
      }}
    />
  );
}
