import { hasCapability } from "@/modules/advising/domain/capabilities";
import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

import { readAdminPage } from "@/app/admin/_read";
import { UsersTableWrapper } from "@/app/admin/_components/users-table.vm";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
}) {
  const { user } = await requireCapability("user:read");
  const { page, pageSize } = await searchParams;
  const { data, readFailed } = await readAdminPage(() =>
    getContainer().advising.admin.listUsers.execute({
      page: Number(page),
      pageSize: Number(pageSize),
    }),
  );

  return (
    <UsersTableWrapper
      page={data}
      basePath="/admin/users"
      readFailed={readFailed}
      canManageRole={hasCapability(user.role, "user:manage")}
      canSupport={hasCapability(user.role, "user:support")}
    />
  );
}
