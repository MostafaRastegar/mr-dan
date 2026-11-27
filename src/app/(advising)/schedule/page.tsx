import { ScheduleWeekWrapper } from "./schedule-week.vm";
import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { currentWeekKey, resolveWeekKey } from "@/modules/advising/application/weekly-goal";

export const metadata = { title: "برنامه هفتگی — mr-dan" };
function safeWeekKey(param?: string): string {
  try {
    return param ? resolveWeekKey(param) : currentWeekKey();
  } catch {
    return currentWeekKey();
  }
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { user } = await requireCapability("schedule:read");
  const weekKey = safeWeekKey((await searchParams).week);
  const container = getContainer();
  const actor = { id: user.id, role: user.role };
  const [program, schoolProgram, catalog, chapters] = await Promise.all([
    container.advising.getStudentStudyPlan.execute({ actor, studentId: user.id, weekKey }),
    container.advising.listSchoolProgram.execute({ actor }),
    container.advising.catalogOptions.execute(),
    container.advising.listChapters(),
  ]);
  return (
    <ScheduleWeekWrapper
      program={program}
      chapters={chapters}
      currentWeekKey={currentWeekKey()}
      schoolProgram={schoolProgram}
      canWriteProgram={hasCapability(user.role, "program:write")}
      fieldOfStudy={user.fieldOfStudy}
      subjects={catalog.subjects}
      labels={catalog.subjectLabels}
    />
  );
}
