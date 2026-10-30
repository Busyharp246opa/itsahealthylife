import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { ReviewPostReportForm } from "../../../components/flow-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Post reports" };
export default async function PostReportsPage() {
  const session = await getLocalSuperAdmin();
  const reports = session ? await session.admin.from("post_reports").select("id,post_id,reason,detail,status,created_at,posts(title,body,status)").order("created_at", { ascending: false }).limit(100) : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Post reports" description="Review member reports with a saved audit event." backHref="/admin/more" />{session ? <section className="fc-panel"><SectionHeader title="Recent reports" />{reports?.data?.length ? <div className="fc-case-list">{reports.data.map((item) => <article key={item.id}><div><strong>{item.reason} · post {item.post_id.slice(0, 8)}</strong><p>{item.posts?.title || item.posts?.body || "Post unavailable"}</p><p>{item.detail || "No extra detail"}</p><small>{new Date(item.created_at).toLocaleString("en-AE")}</small><StatusBadge>{item.status} · {item.posts?.status ?? "missing"}</StatusBadge></div>{item.status === "open" ? <ReviewPostReportForm id={item.id} /> : null}</article>)}</div> : <p>No reports yet.</p>}</section> : <p className="fc-local-note">A super admin account is required until delegated moderation scopes are approved.</p>}</div>;
}
