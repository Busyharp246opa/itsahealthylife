import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Download, MessageCircle, Paperclip, ShieldCheck, Video } from "lucide-react";
import { getConversation, getConversations } from "../../lib/fitcircle-data";
import { MessageForm } from "./mutation-forms";
import { RealtimeConversation } from "./realtime-conversation";
import { Avatar, PageHeader, StatusBadge } from "./workspace-ui";

export async function ConversationDetail({ id, basePath = "/messages" }: { id: string; basePath?: string }) {
  const [conversation, conversations] = await Promise.all([getConversation(id), getConversations()]);
  if (!conversation) notFound();
  return <div className="fc-page fc-messages-page">
    <PageHeader eyebrow="Chat" title={conversation.title} description="Share quick updates and files with your circle." backHref={basePath} actions={<button type="button" className="fc-button fc-button--quiet" disabled><Video size={16} aria-hidden /> Calls unavailable</button>} />
    <div className="fc-message-layout"><aside className="fc-message-sidebar" aria-label="Conversations">
      {conversations.map((item) => <Link href={basePath + "/" + item.id} key={item.id} className={item.id === id ? "is-current" : ""} aria-current={item.id === id ? "page" : undefined}><MessageCircle size={17} aria-hidden /><span><strong>{item.title}</strong><small>{item.messages.at(-1)?.body ?? "No messages"}</small></span><ChevronRight size={15} aria-hidden /></Link>)}
    </aside><section className="fc-chat-panel" aria-label={"Conversation with " + conversation.title}>
      <header><ShieldCheck size={16} aria-hidden /><span>Local demo thread</span><RealtimeConversation conversationId={conversation.id} /><StatusBadge>{conversation.kind}</StatusBadge></header>
      <div className="fc-chat-log" aria-live="polite">
        {conversation.messages.map((message) => <article className={message.sender_user_id ? "is-mine" : ""} key={message.id}>
          {!message.sender_user_id ? <Avatar name={message.profiles?.display_name} tone={message.profiles?.avatar_tone} size="sm" /> : null}
          <div><strong>{message.sender_user_id ? "You" : message.profiles?.display_name ?? "Healthy Life"}</strong>
            {message.body !== "Attachment" || !message.message_attachments?.length ? <p>{message.body}</p> : null}
            {message.message_attachments?.map((attachment) => <a className="fc-attachment-link" href={"/api/messages/attachments/" + attachment.id} key={attachment.id} download><Paperclip size={16} aria-hidden /><span>{attachment.file_name}<small>{(attachment.byte_size / 1024 / 1024).toFixed(1)} MB</small></span><Download size={16} aria-hidden /></a>)}
            <small>{new Intl.DateTimeFormat("en-AE", { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))} · {message.status}</small>
          </div>
        </article>)}
      </div><MessageForm conversationId={conversation.id} />
    </section></div>
  </div>;
}
