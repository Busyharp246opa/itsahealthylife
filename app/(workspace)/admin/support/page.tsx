import Link from "next/link";
import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { PageHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Admin support" };
export default async function AdminSupportPage() {
  const session = await getLocalSuperAdmin();
  const tickets = session ? await session.admin.from("support_tickets").select("id,subject,category,status,created_at").order("created_at", { ascending: false }).limit(100) : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Support queue" description="Review local member conversations and save an auditable reply." backHref="/admin/more" />{session ? <section className="fc-panel"><div className="fc-focus-row-list">{tickets?.data?.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="fc-focus-row"><span><strong>{ticket.subject}</strong><small>{ticket.category} · {new Date(ticket.created_at).toLocaleDateString("en-AE")}</small></span><StatusBadge>{ticket.status.replaceAll("_", " ")}</StatusBadge></Link>)}</div>{!tickets?.data?.length ? <p>No support tickets yet.</p> : null}</section> : <p className="fc-local-note">A super admin account is required until delegated sub-admin scopes are approved.</p>}</div>;
}
