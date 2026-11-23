import { ScheduleWeekWrapper } from "./schedule-week.vm";
import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";

export const metadata = { title: "برنامه هفتگی — mr-dan" };

export default async function SchedulePage() {
  const { user } = await requireCapability("schedule:read");
  const entries = await getContainer().advising.listWeeklySchedule.execute({
    actor: { id: user.id, role: user.role },
  });
  return (
    <ScheduleWeekWrapper
      entries={entries}
      canWrite={hasCapability(user.role, "schedule:write")}
      fieldOfStudy={user.fieldOfStudy}
    />
  );
}
