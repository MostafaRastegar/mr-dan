import { requireCapability } from "@/server/advising-guards";

import { KnowledgePageWrapper } from "./knowledge-page.vm";

export default async function AdminKnowledgePage(): Promise<React.ReactNode> {
  await requireCapability("rag:manage");
  return <KnowledgePageWrapper />;
}
