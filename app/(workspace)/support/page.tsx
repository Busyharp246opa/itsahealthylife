import Link from "next/link";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { SupportTicketForm } from "../../components/flow-forms";
import { LocalDataNote, PageHeader, SectionHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Support" };
export default async function SupportPage() {
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const tickets = user && !user.is_anonymous && db ? await db.from("support_tickets").select("id,subject,category,status,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }) : null;
  return <div className="fc-page"><PageHeader eyebrow="Help" title="Support conversations" description="Ask a question, track its status, and continue the conversation in your local account." /><LocalDataNote>Support replies are stored locally; there is no email or push delivery.</LocalDataNote>
    {user && !user.is_anonymous ? <><section className="fc-panel"><SectionHeader title="Open a ticket" /><SupportTicketForm /></section><section className="fc-panel"><SectionHeader title="Your tickets" />{tickets?.data?.length ? <div className="fc-focus-row-list">{tickets.data.map((ticket) => <Link href={`/support/${ticket.id}`} key={ticket.id} className="fc-focus-row"><span><strong>{ticket.subject}</strong><small>{ticket.category} · {new Date(ticket.created_at).toLocaleDateString("en-AE")}</small></span><StatusBadge>{ticket.status.replaceAll("_", " ")}</StatusBadge></Link>)}</div> : <p>No tickets yet.</p>}</section></> : <section className="fc-panel"><p><Link href="/auth/login">Sign in to a registered account</Link> to open and track support tickets.</p></section>}
  </div>;
}
