import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../lib/supabase/availability";
import { SupportReplyForm } from "../../../components/flow-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Support ticket" };
export default async function SupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  if (await isOfflinePreview()) notFound();
  const { id } = await params;
  const db = await createServerSupabaseClient();
  const ticket = await db.from("support_tickets").select("id,subject,body,category,status,created_at").eq("id", id).maybeSingle();
  if (!ticket.data) notFound();
  const messages = await db.from("support_messages").select("id,author_id,body,created_at").eq("ticket_id", id).order("created_at");
  const { data: { user } } = await db.auth.getUser();
  return <div className="fc-page"><PageHeader eyebrow="Support ticket" title={ticket.data.subject} description={`${ticket.data.category} · Opened ${new Date(ticket.data.created_at).toLocaleDateString("en-AE")}`} backHref="/support" /><StatusBadge>{ticket.data.status.replaceAll("_", " ")}</StatusBadge><section className="fc-panel"><SectionHeader title="Conversation" /><div className="fc-support-thread"><article><strong>You</strong><p>{ticket.data.body}</p></article>{messages.data?.map((message) => <article key={message.id}><strong>{message.author_id === user?.id ? "You" : "Healthy Life support"}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("en-AE")}</small></article>)}</div></section>{ticket.data.status !== "resolved" ? <section className="fc-panel"><SectionHeader title="Reply" /><SupportReplyForm ticketId={id} /></section> : <p className="fc-local-note">This ticket is resolved. <Link href="/support">Open a new ticket</Link> if you need more help.</p>}</div>;
}
