import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminSpotlightForm, EndSpotlightForm } from "../../../components/engagement-forms";
import { PageHeader, SectionHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Coach spotlight" };
export default async function AdminSpotlightPage() {
  const session = await getLocalSuperAdmin();
  const [coaches, spotlights] = session ? await Promise.all([
    session.admin.from("coach_profiles").select("id,profiles(display_name)").not("verified_at", "is", null).order("created_at", { ascending: false }),
    session.admin.from("coach_spotlights").select("id,coach_id,title,starts_on,ends_on,is_active").order("created_at", { ascending: false }).limit(100),
  ]) : [null, null];
  const names = new Map((coaches?.data ?? []).map((coach) => [coach.id, coach.profiles?.display_name ?? "Coach"]));
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Coach spotlight" description="Schedule a banner for a verified coach and end it early if needed." backHref="/admin/more" />{session ? <><section className="fc-panel"><SectionHeader title="Schedule spotlight" />{coaches?.data?.length ? <AdminSpotlightForm coaches={coaches.data.map((coach) => ({ id: coach.id, name: coach.profiles?.display_name ?? "Coach" }))} /> : <p>No verified coaches are eligible.</p>}</section><section className="fc-panel"><SectionHeader title="Spotlight history" /><div className="fc-record-list">{spotlights?.data?.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{names.get(item.coach_id) ?? "Coach"} · {item.starts_on} → {item.ends_on}</p><StatusBadge>{item.is_active ? "Active schedule" : "Ended"}</StatusBadge></div>{item.is_active ? <EndSpotlightForm id={item.id} /> : null}</article>)}</div></section></> : <p className="fc-local-note">A super admin account is required until delegated spotlight scopes are approved.</p>}</div>;
}
