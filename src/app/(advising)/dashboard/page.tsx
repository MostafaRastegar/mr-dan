import { DashboardWrapper } from "./dashboard.vm";
import { DASHBOARD_FIXTURE, EMPTY_DASHBOARD } from "./dashboard.fixture";
import { redirect } from "next/navigation";
import { requireSessionUser } from "@/server/advising-guards";

type Demo = "success" | "empty" | "loading" | "error";

export default async function DashboardPage({
  searchParams,
}: Readonly<{ searchParams: { demo?: string } }>) {
  const { user } = await requireSessionUser();
  if (user.role === "counselor") redirect("/counselor/students");
  const demo = (searchParams.demo ?? "success") as Demo;
  const data = demo === "empty" ? EMPTY_DASHBOARD : DASHBOARD_FIXTURE;
  return <DashboardWrapper data={data} demo={demo} />;
}
