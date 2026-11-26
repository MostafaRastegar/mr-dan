import { redirect } from "next/navigation";

import { requireCapability } from "@/server/advising-guards";

export default async function AdminIndexPage(): Promise<never> {
  await requireCapability("user:read");
  redirect("/admin/users");
}
