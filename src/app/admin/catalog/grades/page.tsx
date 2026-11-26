import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { GRADE_CONFIG } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createGradeAction,
  reactivateGradeAction,
  retireGradeAction,
  updateGradeAction,
} from "./grades.actions";

export default async function AdminGradesPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.grades.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={GRADE_CONFIG}
      page={data}
      basePath="/admin/catalog/grades"
      readFailed={readFailed}
      actions={{
        create: createGradeAction,
        update: updateGradeAction,
        retire: retireGradeAction,
        reactivate: reactivateGradeAction,
      }}
    />
  );
}
