import { ConversationDetail } from "../../../../components/conversation-detail";
export default async function TrainerConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConversationDetail id={id} basePath="/trainer/messages" />;
}
