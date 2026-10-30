import Link from "next/link";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { MarkNotificationReadForm } from "../../components/flow-forms";
import { LocalDataNote, PageHeader, SectionHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Notifications" };
export default async function NotificationsPage() {
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const notifications = user && db ? await db.from("notifications").select("id,kind,title,body,href,read_at,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(100) : null;
  return <div className="fc-page"><PageHeader eyebrow="Your inbox" title="Notifications" description="Local messages and reminders saved for your account." /><LocalDataNote>Push and email delivery are not connected.</LocalDataNote><section className="fc-panel"><SectionHeader title="Recent" />{notifications?.data?.length ? <div className="fc-record-list">{notifications.data.map((item) => <article key={item.id}><div><strong>{item.title}</strong><StatusBadge>{item.read_at ? "Read" : "New"}</StatusBadge><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("en-AE")}</small>{item.href && item.href !== "/notifications" ? <p><Link href={item.href}>Open</Link></p> : null}</div>{!item.read_at ? <MarkNotificationReadForm id={item.id} /> : null}</article>)}</div> : <p>{user ? "No notifications yet." : <>Sign in to see notifications. <Link href="/auth/login">Sign in</Link></>}</p>}</section></div>;
}
