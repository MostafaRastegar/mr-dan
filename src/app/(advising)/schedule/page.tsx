import { ScheduleWeekWrapper } from "./schedule-week.vm";
import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";

export const metadata = { title: "برنامه هفتگی — mr-dan" };

export default async function SchedulePage() {
  const { user } = await requireCapability("schedule:read");
  const [weeklyEntries, schoolProgram] = await Promise.all([
    getContainer().advising.listWeeklySchedule.execute({
      actor: { id: user.id, role: user.role },
    }),
    getContainer().advising.listSchoolProgram.execute({
      actor: { id: user.id, role: user.role },
    }),
  ]);
  const schoolProgramEntries = schoolProgram.map((e) => ({
    id: e.id,
    dayOfWeek: e.dayOfWeek,
    subject: e.subject,
    hours: e.minutes / 60,
  }));
  return (
    <ScheduleWeekWrapper
      entries={weeklyEntries}
      schoolProgramEntries={schoolProgramEntries}
      canWrite={hasCapability(user.role, "schedule:write")}
      fieldOfStudy={user.fieldOfStudy}
    />
  );
}
