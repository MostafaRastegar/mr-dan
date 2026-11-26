import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { bookConfig } from "@/app/admin/_components/catalog-configs";
import { CatalogManagerWrapper } from "@/app/admin/_components/catalog-manager.vm";
import {
  createBookAction,
  reactivateBookAction,
  retireBookAction,
  updateBookAction,
} from "./books.actions";

export default async function AdminBooksPage(props: {
  searchParams: AdminSearchParams;
}) {
  await requireCapability("catalog:manage");
  const { page, pageSize } = await props.searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.books.list({ page: Number(page), pageSize: Number(pageSize) }),
  );

  return (
    <CatalogManagerWrapper
      config={await bookConfig()}
      page={data}
      basePath="/admin/catalog/books"
      readFailed={readFailed}
      actions={{
        create: createBookAction,
        update: updateBookAction,
        retire: retireBookAction,
        reactivate: reactivateBookAction,
      }}
    />
  );
}
