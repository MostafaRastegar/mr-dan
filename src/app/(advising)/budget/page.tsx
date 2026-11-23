import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { iranDayKey, isDayKey } from "@/modules/advising/domain/day-key";

import { BudgetDayWrapper } from "./budget-day.vm";

export const metadata = { title: "وقت آزاد — mr-dan" };

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { user } = await requireCapability("budget:read");
  const { date } = await searchParams;
  const dayKey = date && isDayKey(date) ? date : iranDayKey(new Date());
  const day = await getContainer().advising.getDayBudget.execute({
    actor: { id: user.id, role: user.role },
    dayKey,
  });
  return (
    <BudgetDayWrapper
      day={day}
      canWrite={hasCapability(user.role, "budget:write")}
    />
  );
}
