import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminBadgeAwardForm, AdminBadgeForm } from "../../../components/engagement-forms";
import { PageHeader, SectionHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Admin badges" };
export default async function AdminBadgesPage() {
  const session = await getLocalSuperAdmin();
  const [badges, profiles, authUsers] = session ? await Promise.all([
    session.admin.from("badges").select("id,title,description,tier").order("created_at", { ascending: false }),
    session.admin.from("profiles").select("user_id,display_name").not("user_id", "is", null).order("display_name").limit(1000),
    session.admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]) : [null, null, null];
  const registered = new Set(authUsers?.data.users.filter((user) => !user.is_anonymous).map((user) => user.id));
  const members = (profiles?.data ?? []).filter((profile) => profile.user_id && registered.has(profile.user_id)).map((profile) => ({ id: profile.user_id!, name: profile.display_name }));
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Badges" description="Define a badge and award it manually to a registered member." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Create badge" /><AdminBadgeForm /></section><section className="fc-panel"><SectionHeader title="Manual award" />{badges?.data?.length && members.length ? <AdminBadgeAwardForm badges={badges.data} members={members} /> : <p>Create a badge and register a member before awarding.</p>}</section><section className="fc-panel"><SectionHeader title="Badge catalog" /><div className="fc-record-list">{badges?.data?.map((badge) => <article key={badge.id}><div><strong>{badge.title} · {badge.tier}</strong><p>{badge.description}</p></div></article>)}</div></section></> : <p className="fc-local-note">A super admin account is required until delegated badge scopes are approved.</p>}</div>;
}
