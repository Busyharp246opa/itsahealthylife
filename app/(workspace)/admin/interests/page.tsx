import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminDiscoveryTagForm } from "../../../components/profile-detail-forms";
import { PageHeader, SectionHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Interests and prompts" };
export default async function AdminInterestsPage() {
  const session = await getLocalSuperAdmin();
  const tags = session ? await session.admin.from("discovery_tags").select("id,kind,label,priority,is_active").order("kind").order("priority", { ascending: false }).order("label") : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Interests and prompts" description="Publish topics and set their influence on matching public discovery results." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Add a choice" /><AdminDiscoveryTagForm /></section><section className="fc-panel"><SectionHeader title="Manage choices" />{tags?.data?.length ? <div className="fc-tag-admin-list">{tags.data.map((tag) => <article key={tag.id}><h3>{tag.label}</h3><AdminDiscoveryTagForm tag={tag} /></article>)}</div> : <p>No choices yet.</p>}</section></> : <p className="fc-local-note">A super admin account is required until delegated catalog scopes are approved.</p>}</div>;
}
