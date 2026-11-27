import { DashboardWrapper } from "./dashboard.vm";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";
import { redirect } from "next/navigation";

export const metadata = { title: "داشبورد — mr-dan" };

export default async function DashboardPage() {
  const { user } = await requireSessionUser();
  if (user.role === "counselor") redirect("/counselor/students");
  // Operators have no planning surface; the dashboard would render empty data.
  if (user.role === "operator") redirect("/profile");

  const container = getContainer();
  const [overview, catalog] = await Promise.all([
    container.advising.dashboardOverview.execute({
      actor: { id: user.id, role: user.role },
    }),
    container.advising.catalogOptions.execute(),
  ]);

  return (
    <DashboardWrapper overview={overview} labels={catalog.subjectLabels} />
  );
}
