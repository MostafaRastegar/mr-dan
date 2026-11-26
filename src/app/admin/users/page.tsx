import { hasCapability } from "@/modules/advising/domain/capabilities";
import { requireCapability } from "@/server/advising-guards";
import { getContainer } from "@/server/container";
import { readAdminOptions, readAdminPage, type AdminSearchParams } from "@/app/admin/_read";
import { UsersTableWrapper } from "@/app/admin/_components/users-table.vm";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const { user } = await requireCapability("user:read");
  const sp = await searchParams;
  const admin = getContainer().advising.admin;
  const { data, readFailed } = await readAdminPage(() =>
    admin.listUsers.execute({
      page: Number(sp.page),
      pageSize: Number(sp.pageSize),
      counselorId: sp.counselor,
      role: sp.role,
      q: sp.q,
    }),
  );
  const counselors = await readAdminOptions(() =>
    admin.listCounselors.execute(),
  );
  return (
    <UsersTableWrapper
      page={data}
      basePath="/admin/users"
      filters={{ role: sp.role ?? "", counselorId: sp.counselor ?? "", q: sp.q ?? "" }}
      counselorOptions={counselors.options}
      counselorOptionsFailed={counselors.failed}
      readFailed={readFailed}
      canManageRole={hasCapability(user.role, "user:manage")}
      canSupport={hasCapability(user.role, "user:support")}
    />
  );
}
