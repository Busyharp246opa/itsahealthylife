import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminChallengeForm } from "../../../components/flow-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Admin challenges" };
export default async function AdminChallengesPage() {
  const session = await getLocalSuperAdmin();
  const challenges = session ? await session.admin.from("challenges").select("id,name,metric,target,unit,starts_on,ends_on,status,reward_coins").order("starts_on", { ascending: false }).limit(100) : null;
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Platform challenges" description="Create a dated challenge and publish its rules to members." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Create challenge" /><AdminChallengeForm /></section><section className="fc-panel"><SectionHeader title="Challenge history" /><div className="fc-focus-row-list">{challenges?.data?.map((item) => <article key={item.id} className="fc-focus-row"><span><strong>{item.name}</strong><small>{item.target} {item.unit} · {item.metric} · {item.starts_on} → {item.ends_on} · {item.reward_coins} coins</small></span><StatusBadge>{item.status}</StatusBadge></article>)}</div></section></> : <p className="fc-local-note">A super admin account is required to create challenges.</p>}</div>;
}
