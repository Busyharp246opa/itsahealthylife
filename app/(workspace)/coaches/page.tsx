import Link from "next/link";
import { BadgeCheck, Clock3, Star } from "lucide-react";
import { getCoaches } from "../../../lib/fitcircle-data";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { Avatar, LocalDataNote, PageHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Coaches" };

export default async function CoachesPage() {
  const coaches = await getCoaches();
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const spotlights = db ? await db.from("coach_spotlights").select("id,coach_id,title").order("starts_on", { ascending: false }).limit(3) : null;
  const promoted = (spotlights?.data ?? []).map((spotlight) => ({ ...spotlight, coach: coaches.find((coach) => coach.id === spotlight.coach_id) })).filter((item) => item.coach);
  return <div className="fc-page"><PageHeader eyebrow="Coaching marketplace" title="Find the right kind of help." description="Explore FitSphere and Coach Sphere profiles, specialties, and local booking examples." /><LocalDataNote>Seeded coaches, reviews, prices and availability are fictional. Coach-type privileges and pricing need an approved role matrix.</LocalDataNote>{promoted.length ? <section className="fc-panel"><h2>Coach spotlight</h2>{promoted.map((item) => <Link className="fc-focus-row" href={`/coaches/${item.coach_id}`} key={item.id}><Avatar name={item.coach?.profiles?.display_name} handle={item.coach?.profiles?.handle} tone="coach" size="sm" /><span><strong>{item.title}</strong><small>{item.coach?.profiles?.display_name} · verified local coach</small></span></Link>)}</section> : null}<div className="fc-coach-grid">{coaches.map((coach) => <Link href={`/coaches/${coach.id}`} className="fc-coach-card" key={coach.id}><header><Avatar name={coach.profiles?.display_name} handle={coach.profiles?.handle} tone="coach" size="lg" /><div><StatusBadge tone="accent">{coach.coaching_type}</StatusBadge><span><Star size={15} fill="currentColor" aria-hidden /> {coach.rating.toFixed(2)} <small>({coach.review_count})</small></span></div></header><h2>{coach.profiles?.display_name}{coach.profiles?.is_verified ? <BadgeCheck size={17} aria-label="Verified synthetic coach" /> : null}</h2><p>{coach.profiles?.headline}</p><div className="fc-tag-row">{coach.specialties.map((item) => <span key={item}>{item}</span>)}</div><footer><span>From <strong>{coach.currency} {coach.base_price}</strong></span><small><Clock3 size={14} aria-hidden /> Replies in {coach.response_hours}h</small></footer></Link>)}</div></div>;
}
