import { HomeworkBoardWrapper } from "./homework-board.vm";
import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";
import { iranDayKey } from "@/modules/advising/domain/day-key";
import { subjectOptions } from "@/modules/advising/domain/catalog";

export const metadata = { title: "تکالیف — mr-dan" };

export default async function HomeworkPage() {
  const { user } = await requireCapability("homework:read");
  const container = getContainer();
  const catalog = await container.advising.catalogOptions.execute();
  const items = await container.advising.listHomework.execute({
    actor: { id: user.id, role: user.role },
    filter: "all",
  });
  return (
    <HomeworkBoardWrapper
      items={items}
      canWrite={hasCapability(user.role, "homework:write")}
      todayKey={iranDayKey(new Date())}
      labels={catalog.subjectLabels}
      subjectOptions={subjectOptions(catalog.subjects, {
        field: null,
        grade: null,
      })}
    />
  );
}
