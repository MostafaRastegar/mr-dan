import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { chapterConfig } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createChapterAction,
  reactivateChapterAction,
  retireChapterAction,
  updateChapterAction,
} from "./chapters.actions";

export default async function AdminChaptersPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.chapters.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={await chapterConfig()}
      page={data}
      basePath="/admin/catalog/chapters"
      readFailed={readFailed}
      actions={{
        create: createChapterAction,
        update: updateChapterAction,
        retire: retireChapterAction,
        reactivate: reactivateChapterAction,
      }}
    />
  );
}
