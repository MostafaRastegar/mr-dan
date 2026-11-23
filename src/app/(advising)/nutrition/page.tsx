import { getContainer } from "@/server/container";
import { requireCapability } from "@/server/advising-guards";
import { hasCapability } from "@/modules/advising/domain/capabilities";

import { NutritionBoardWrapper } from "./nutrition-board.vm";

export const metadata = { title: "تغذیه — mr-dan" };

export default async function NutritionPage() {
  const { user } = await requireCapability("nutrition:read");
  const overview = await getContainer().advising.getNutritionOverview.execute({
    actor: { id: user.id, role: user.role },
  });

  return (
    <NutritionBoardWrapper
      overview={overview}
      canWrite={hasCapability(user.role, "nutrition:write")}
    />
  );
}
