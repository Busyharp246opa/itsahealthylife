import { notFound } from "next/navigation";
import { getLocalSuperAdmin } from "../../../../../lib/supabase/super-admin";
import { SupportReplyForm } from "../../../../components/flow-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../../components/workspace-ui";

export const metadata = { title: "Admin support ticket" };
export default async function AdminSupportTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getLocalSuperAdmin();
  if (!session) notFound();
  const { id } = await params;
  const ticket = await session.admin.from("support_tickets").select("id,subject,body,category,status,created_at").eq("id", id).maybeSingle();
  if (!ticket.data) notFound();
  const messages = await session.admin.from("support_messages").select("id,author_id,body,created_at").eq("ticket_id", id).order("created_at");
  return <div className="fc-page"><PageHeader eyebrow="Support queue" title={ticket.data.subject} description={`${ticket.data.category} · Opened ${new Date(ticket.data.created_at).toLocaleDateString("en-AE")}`} backHref="/admin/support" /><StatusBadge>{ticket.data.status.replaceAll("_", " ")}</StatusBadge><section className="fc-panel"><SectionHeader title="Conversation" /><div className="fc-support-thread"><article><strong>Member</strong><p>{ticket.data.body}</p></article>{messages.data?.map((message) => <article key={message.id}><strong>{message.author_id === session.user.id ? "You · support" : "Member or operator"}</strong><p>{message.body}</p><small>{new Date(message.created_at).toLocaleString("en-AE")}</small></article>)}</div></section><section className="fc-panel"><SectionHeader title="Reply and set status" /><SupportReplyForm ticketId={id} operator /></section></div>;
}
