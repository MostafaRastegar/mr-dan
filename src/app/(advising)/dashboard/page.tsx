import { DashboardWrapper } from "./dashboard.vm";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";
import { redirect } from "next/navigation";

export const metadata = { title: "داشبورد — mr-dan" };

export default async function DashboardPage() {
  const { user } = await requireSessionUser();
  if (user.role === "counselor") redirect("/counselor/students");

  const overview = await getContainer().advising.dashboardOverview.execute({
    actor: { id: user.id, role: user.role },
  });

  return <DashboardWrapper overview={overview} />;
}
