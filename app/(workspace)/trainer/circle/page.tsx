import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getCircleData } from "../../../../lib/fitcircle-data";
import { getTrainerCircleSession } from "../../../../lib/circle-access";
import { isOfflinePreview } from "../../../../lib/supabase/availability";
import { CircleTimeline } from "../../../components/circle-timeline";
import { PostForm } from "../../../components/mutation-forms";
import { Avatar, LocalDataNote, PageHeader, SectionHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Trainer Circle" };

export default async function TrainerCirclePage() {
  const [session, offline] = await Promise.all([getTrainerCircleSession(), isOfflinePreview()]);
  if (!session && !offline) return <div className="fc-page"><PageHeader eyebrow="Trainer Circle" title="Your trainer community." description="This separate Circle is available to approved trainers after account setup." /><section className="fc-panel"><Link className="fc-button fc-button--primary" href="/auth/login">Trainer sign in</Link></section></div>;
  const data = await getCircleData("trainer");
  const guideline = session ? await session.db.from("community_guidelines").select("body").eq("id", "main").maybeSingle() : null;
  return <div className="fc-page fc-social-page"><PageHeader eyebrow="Trainer Circle" title="Connect with other trainers." description="Share coaching ideas, ask questions, and keep the conversation moving." /><details className="fc-social-composer" id="compose"><summary><span className="fc-social-composer-icon">+</span><span><strong>Create a trainer post</strong><small>Share a coaching note with approved trainers.</small></span><span className="fc-social-composer-action">Write a post</span></summary><div className="fc-social-composer-body"><PostForm communities={[]} circleSpace="trainer" /></div></details>
    <div className="fc-circle-layout"><section className="fc-feed"><SectionHeader title="Latest in Trainer Circle" /><CircleTimeline posts={data.posts} viewerId={session?.user.id ?? null} canReport={!!session} /></section>
      <aside><section className="fc-panel"><SectionHeader title="Trainers to know" /><div className="fc-people-list">{data.people.slice(0, 4).map((person) => <Link href={`/people/${person.handle}`} key={person.id}><Avatar name={person.display_name} handle={person.handle} tone={person.avatar_tone} size="sm" /><span><strong>{person.display_name}{person.is_verified ? <BadgeCheck size={13} aria-hidden /> : null}</strong><small>{person.headline}</small></span></Link>)}</div></section><details className="fc-social-guidelines"><summary>Community guidelines</summary><p>{guideline?.data?.body ?? "Treat people with respect. Report unsafe content."}</p><Link href="/support">Contact support</Link></details><LocalDataNote>Trainer posts stay in the trainer space. Seeded identities are fictional.</LocalDataNote></aside>
    </div>
  </div>;
}
