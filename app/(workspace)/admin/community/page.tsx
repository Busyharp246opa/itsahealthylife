import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminCommunityForm } from "../../../components/flow-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Admin communities" };
export default async function AdminCommunityPage() {
  const session = await getLocalSuperAdmin();
  const communities = session ? await session.admin.from("communities").select("id,name,topic,is_private,created_at").order("created_at", { ascending: false }).limit(100) : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Communities" description="Create public topic rooms for member posts." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Create a room" /><AdminCommunityForm /></section><section className="fc-panel"><SectionHeader title="Existing rooms" /><div className="fc-focus-row-list">{communities?.data?.map((item) => <article key={item.id} className="fc-focus-row"><span><strong>{item.name}</strong><small>{item.topic} · {new Date(item.created_at).toLocaleDateString("en-AE")}</small></span><StatusBadge>{item.is_private ? "Private" : "Public"}</StatusBadge></article>)}</div></section></> : <p className="fc-local-note">A super admin account is required to create communities.</p>}</div>;
}
