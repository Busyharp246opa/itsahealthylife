import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { LocalDataNote, PageHeader, SectionHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Badges" };
export default async function BadgesPage() {
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const [badges, awards] = db ? await Promise.all([
    db.from("badges").select("id,title,description,tier,image_path").order("created_at", { ascending: false }),
    user ? db.from("badge_awards").select("badge_id,awarded_at,note").eq("recipient_user_id", user.id) : Promise.resolve({ data: [] }),
  ]) : [{ data: [] }, { data: [] }];
  const owned = new Map((awards.data ?? []).map((item) => [item.badge_id, item]));
  return <div className="fc-page"><PageHeader eyebrow="Recognition" title="Badges" description="Browse local badge definitions and see which ones an admin has awarded you." /><LocalDataNote>Manual awards are saved locally. Automatic conditions and coin rewards are pending approved rules.</LocalDataNote><section className="fc-panel"><SectionHeader title="Available badges" />{badges.data?.length ? <div className="fc-badge-grid">{badges.data.map((badge) => <article className="fc-panel" key={badge.id}><Image src={badge.image_path} width={56} height={56} alt="" /><h2>{badge.title}</h2><StatusBadge>{badge.tier}</StatusBadge><p>{badge.description}</p>{owned.has(badge.id) ? <strong>Awarded {new Date(owned.get(badge.id)!.awarded_at).toLocaleDateString("en-AE")}</strong> : <small>Not awarded</small>}</article>)}</div> : <p>No badges have been defined yet.</p>}{!user ? <p><Link href="/auth/login">Sign in</Link> to see your awards.</p> : null}</section></div>;
}
