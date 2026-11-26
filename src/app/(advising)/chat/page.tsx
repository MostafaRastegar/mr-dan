import { requireSessionUser } from "@/server/advising-guards";

import { ChatPageWrapper } from "./chat-page.vm";

export default async function ChatPageRoute(): Promise<React.ReactNode> {
  await requireSessionUser();
  return <ChatPageWrapper />;
}
