import { notFound, redirect } from "next/navigation";
import { UsersRound } from "lucide-react";
import { getCommunity } from "../../../../../lib/fitcircle-data";
import { isOfflinePreview } from "../../../../../lib/supabase/availability";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";
import { CircleTimeline } from "../../../../components/circle-timeline";
import { LocalDataNote, PageHeader } from "../../../../components/workspace-ui";

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (db && user) {
    const { data: profile } = await db.from("profiles").select("role,is_verified").eq("user_id", user.id).maybeSingle();
    if (profile?.is_verified && ["coachsphere", "fitsphere"].includes(profile.role)) redirect("/trainer/circle");
  }
  const data = await getCommunity(slug);
  if (!data) notFound();
  return <div className="fc-page">
    <PageHeader eyebrow={`Trainee community · ${data.community.topic}`} title={data.community.name} description={data.community.description} backHref="/circle" actions={<span className="fc-button fc-button--quiet"><UsersRound size={16} aria-hidden /> {data.community.member_count.toLocaleString()} members</span>} />
    <LocalDataNote>Posts, likes, and comments belong to the trainee Circle. Seeded identities and member counts are fictional.</LocalDataNote>
    <section className="fc-feed fc-feed--wide"><CircleTimeline posts={data.posts} viewerId={user?.id ?? null} canReport={!!user && !user.is_anonymous} /></section>
  </div>;
}
