import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { PageHeader, SectionHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Admin referrals" };
export default async function AdminReferralsPage() {
  const session = await getLocalSuperAdmin();
  const [codes, attributions] = session ? await Promise.all([
    session.admin.from("referral_codes").select("owner_id,code,created_at").order("created_at", { ascending: false }).limit(100),
    session.admin.from("referral_attributions").select("referred_user_id,referrer_user_id,code,created_at").order("created_at", { ascending: false }).limit(100),
  ]) : [null, null];
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Referrals" description="Review local code issuance and one-time attribution. Rewards are not active." backHref="/admin/more" />{session ? <><section className="fc-metric-grid"><article className="fc-panel"><h2>{codes?.data?.length ?? 0}</h2><p>Codes shown</p></article><article className="fc-panel"><h2>{attributions?.data?.length ?? 0}</h2><p>Attributions shown</p></article></section><section className="fc-panel"><SectionHeader title="Recent attribution" /><div className="fc-record-list">{attributions?.data?.map((item) => <article key={item.referred_user_id}><div><strong>{item.code}</strong><p>Invited {item.referred_user_id.slice(0, 8)} · by {item.referrer_user_id.slice(0, 8)}</p><small>{new Date(item.created_at).toLocaleString("en-AE")}</small></div></article>)}</div>{!attributions?.data?.length ? <p>No referrals recorded yet.</p> : null}</section></> : <p className="fc-local-note">A super admin account is required until delegated referral scopes are approved.</p>}</div>;
}
