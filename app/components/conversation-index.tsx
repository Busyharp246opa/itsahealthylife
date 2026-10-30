import Link from "next/link";
import { ChevronRight, MessageCircle, ShieldCheck } from "lucide-react";
import { getConversations } from "../../lib/fitcircle-data";
import { LocalDataNote, StatusBadge } from "./workspace-ui";

export async function ConversationIndex({ basePath = "/messages" }: { basePath?: string }) {
  const conversations = await getConversations();
  return <div className="fc-page fc-messages-page"><header className="fc-page-header"><div><h1>Chat</h1></div></header>
    <LocalDataNote>Example threads are visible in preview. Saved messages and attachments require the local Supabase service.</LocalDataNote>
    <section className="fc-conversation-index">{conversations.map((conversation) => {
      const latest = conversation.messages.at(-1);
      return <Link href={basePath + "/" + conversation.id} key={conversation.id}><span className="fc-conversation-icon"><MessageCircle size={19} aria-hidden /></span><div><span><strong>{conversation.title}</strong><StatusBadge>{conversation.kind}</StatusBadge></span><p>{latest?.body ?? "No messages"}</p><small>{conversation.messages.length} messages</small></div><ChevronRight size={18} aria-hidden /></Link>;
    })}</section>
    <p className="fc-privacy-line"><ShieldCheck size={16} aria-hidden /> Demo threads are shared locally. Member-only conversations restrict file access. Calls and attachment scanning need production services.</p>
  </div>;
}
