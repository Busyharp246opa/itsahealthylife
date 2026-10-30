import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, UsersRound } from "lucide-react";
import { getCircleData } from "../../../lib/fitcircle-data";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { CircleTimeline } from "../../components/circle-timeline";
import { PostForm } from "../../components/mutation-forms";
import { Avatar, LocalDataNote, PageHeader, SectionHeader } from "../../components/workspace-ui";

export const metadata = { title: "Trainee Circle" };

export default async function CirclePage() {
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  if (user && db) {
    const { data: profile } = await db.from("profiles").select("role,is_verified").eq("user_id", user.id).maybeSingle();
    if (profile?.is_verified && ["coachsphere", "fitsphere"].includes(profile.role)) redirect("/trainer/circle");
  }
  const [data, guideline] = await Promise.all([
    getCircleData("trainee"),
    db ? db.from("community_guidelines").select("body").eq("id", "main").maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return <div className="fc-page fc-social-page"><PageHeader eyebrow="Trainee Circle" title="Share the work together." description="A quick place for training updates, questions, and encouragement." /><details className="fc-social-composer" id="compose"><summary><span className="fc-social-composer-icon">+</span><span><strong>Create a post</strong><small>What did you train, learn, or need help with?</small></span><span className="fc-social-composer-action">Write a post</span></summary><div className="fc-social-composer-body"><PostForm communities={data.communities} circleSpace="trainee" /></div></details>
    <nav className="fc-social-rooms" aria-label="Trainee rooms"><span>Explore rooms</span>{data.communities.map((community) => <Link href={`/circle/communities/${community.slug}`} key={community.id}><UsersRound size={15} aria-hidden /><strong>{community.name}</strong><small>{community.post_count.toLocaleString()} seeded posts</small></Link>)}</nav>
    <div className="fc-circle-layout"><section className="fc-feed"><SectionHeader title="Latest in your Circle" /><CircleTimeline posts={data.posts} viewerId={user?.id ?? null} canReport={!!user && !user.is_anonymous} /></section>
      <aside><section className="fc-panel"><SectionHeader title="Trainees to know" /><div className="fc-people-list">{data.people.slice(0, 4).map((person) => <Link href={`/people/${person.handle}`} key={person.id}><Avatar name={person.display_name} handle={person.handle} tone={person.avatar_tone} size="sm" /><span><strong>{person.display_name}{person.is_verified ? <BadgeCheck size={13} aria-hidden /> : null}</strong><small>{person.headline}</small></span></Link>)}</div></section><details className="fc-social-guidelines"><summary>Community guidelines</summary><p>{guideline?.data?.body ?? "Treat people with respect. Report unsafe content."}</p><Link href="/support">Contact support</Link></details><LocalDataNote>Seeded identities and counts are fictional. Your posts, likes, and comments belong to your account.</LocalDataNote></aside>
    </div>
  </div>;
}
