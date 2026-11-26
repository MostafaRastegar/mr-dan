import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { subjectConfig } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createSubjectAction,
  reactivateSubjectAction,
  retireSubjectAction,
  updateSubjectAction,
} from "./subjects.actions";

export default async function AdminSubjectsPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.subjects.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={await subjectConfig()}
      page={data}
      basePath="/admin/catalog/subjects"
      readFailed={readFailed}
      actions={{
        create: createSubjectAction,
        update: updateSubjectAction,
        retire: retireSubjectAction,
        reactivate: reactivateSubjectAction,
      }}
    />
  );
}
