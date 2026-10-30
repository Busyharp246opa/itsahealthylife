import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminNotificationForm } from "../../../components/flow-forms";
import { PageHeader, SectionHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Admin notifications" };
export default async function AdminNotificationsPage() {
  const session = await getLocalSuperAdmin();
  const history = session ? await session.admin.from("notification_campaigns").select("id,title,body,recipient_count,created_at").order("created_at", { ascending: false }).limit(50) : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Local notifications" description="Compose a message for all local user inboxes and review send history." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Compose" /><AdminNotificationForm campaignId={crypto.randomUUID()} /></section><section className="fc-panel"><SectionHeader title="History" />{history?.data?.length ? <div className="fc-record-list">{history.data.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.body}</p><small>{item.recipient_count} inboxes · {new Date(item.created_at).toLocaleString("en-AE")}</small></div></article>)}</div> : <p>No local sends yet.</p>}</section></> : <p className="fc-local-note">A super admin account is required until delegated notification scopes are approved.</p>}</div>;
}
