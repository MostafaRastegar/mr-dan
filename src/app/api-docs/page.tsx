import { requireCapability } from "@/server/advising-guards";

import { ApiDocsPanelWrapper } from "./api-docs-panel.vm";

export default async function ApiDocsPage(): Promise<React.ReactNode> {
  await requireCapability("rag:manage");
  return <ApiDocsPanelWrapper />;
}
