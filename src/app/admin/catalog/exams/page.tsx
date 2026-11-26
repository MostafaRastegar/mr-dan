import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { EXAM_CONFIG } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createExamAction,
  reactivateExamAction,
  retireExamAction,
  updateExamAction,
} from "./exams.actions";

export default async function AdminExamsPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.exams.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={EXAM_CONFIG}
      page={data}
      basePath="/admin/catalog/exams"
      readFailed={readFailed}
      actions={{
        create: createExamAction,
        update: updateExamAction,
        retire: retireExamAction,
        reactivate: reactivateExamAction,
      }}
    />
  );
}
