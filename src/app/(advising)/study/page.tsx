import { StudyTimerWrapper } from "./study-timer.vm";
import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";

export const metadata = { title: "تایمر مطالعه — mr-dan" };

export default async function StudyPage() {
  const { user } = await requireCapability("study:read");
  const analysis = await getContainer().advising.getStudyAnalysis.execute({
    actor: { id: user.id, role: user.role },
    days: 7,
  });
  return (
    <StudyTimerWrapper
      analysis={analysis}
      canWrite={hasCapability(user.role, "study:write")}
      fieldOfStudy={user.fieldOfStudy}
    />
  );
}
