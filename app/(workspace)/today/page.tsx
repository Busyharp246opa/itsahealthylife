import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, Dumbbell, HeartPulse, MessageCircle, UsersRound } from "lucide-react";
import { getTodayData } from "../../../lib/fitcircle-data";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { Avatar, LocalDataNote, SectionHeader } from "../../components/workspace-ui";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const [data, offlinePreview] = await Promise.all([getTodayData(), isOfflinePreview()]);
  const nextWorkout = data.workouts[0];
  const todayLabel = new Intl.DateTimeFormat("en-AE", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Dubai" }).format(new Date());
  const firstPost = data.posts[0];
  return <div className="fc-page fc-focus-today">
    <header className="fc-focus-intro"><div><span>{todayLabel}</span><h1>Good to see you<span>.</span></h1></div><p>One step at a time. Start with what matters today.</p></header>
    <section className="fc-focus-hero" aria-labelledby="today-hero-title">
      <div className="fc-focus-hero__copy"><span>{nextWorkout ? `Next up · ${nextWorkout.duration_minutes} min starter session` : "Your training"}</span><h2 id="today-hero-title">Your next step starts here.</h2><p>{nextWorkout ? "A session is ready to explore, with your plan and your people close by." : "Find a session, make a plan, and keep moving with your people."}</p><div><Link className="fc-button fc-button--primary" href={nextWorkout ? `/train/workouts/${nextWorkout.id}` : "/train"}>{nextWorkout ? "Open session" : "Explore training"}<ArrowRight size={17} aria-hidden /></Link><Link className="fc-button fc-button--outline" href="/calendar">View week</Link></div></div>
      <div className="fc-focus-hero__art" aria-hidden="true"><Image src="/brand/healthy-life-hero.webp" alt="" width={1586} height={992} priority sizes="(max-width: 700px) 300px, 380px" /></div>
    </section>
    <div className="fc-focus-connection"><div className="fc-focus-avatar-stack"><Avatar name="Sam Rivera" tone="coach" size="sm" /><Avatar name="Jordan Lee" tone="calm" size="sm" /><Avatar name="Tara Noor" tone="reward" size="sm" /></div><div><strong>Your people are close by.</strong><p>Training, coaching, and Circle in one place.</p></div><Link href="/circle">Open Circle <ArrowRight size={15} aria-hidden /></Link></div>
    <div className="fc-focus-dashboard"><div className="fc-focus-main-column">
      <section className="fc-panel"><SectionHeader title="Your training" href="/train" actionLabel="See training" /><div className="fc-focus-row-list">{data.workouts.slice(0, 2).map((workout) => <Link href={`/train/workouts/${workout.id}`} key={workout.id} className="fc-focus-row"><span className="fc-focus-row__icon"><Dumbbell size={19} aria-hidden /></span><span><strong>{workout.name}</strong><small>{workout.duration_minutes} min · {workout.workout_exercises.length} movements · {workout.is_template ? "Starter template" : "Your workout"}</small></span><ArrowRight size={17} aria-hidden /></Link>)}<Link href="/calendar" className="fc-focus-row"><span className="fc-focus-row__icon"><CalendarDays size={19} aria-hidden /></span><span><strong>See your schedule</strong><small>Sessions and coach availability</small></span><ArrowRight size={17} aria-hidden /></Link></div></section>
      <section className="fc-panel"><SectionHeader title="Next useful steps" /><div className="fc-focus-row-list"><Link className="fc-focus-row" href="/my-plan"><span className="fc-focus-row__icon"><ClipboardList size={19} aria-hidden /></span><span><strong>My plan</strong><small>Training, diet, and recovery guidance from your trainer</small></span><ArrowRight size={17} aria-hidden /></Link><Link className="fc-focus-row" href="/wellness"><span className="fc-focus-row__icon"><HeartPulse size={19} aria-hidden /></span><span><strong>Check how you feel</strong><small>Private readiness and food log</small></span><ArrowRight size={17} aria-hidden /></Link><Link className="fc-focus-row" href="/messages"><span className="fc-focus-row__icon"><MessageCircle size={19} aria-hidden /></span><span><strong>Messages</strong><small>Keep your conversations together</small></span><ArrowRight size={17} aria-hidden /></Link></div></section>
    </div><div className="fc-focus-side-column">
      <section className="fc-panel"><SectionHeader title="Coming up" href="/calendar" actionLabel="Open calendar" /><p className="fc-focus-panel-copy">See sessions, booking requests, and open coach times in one view.</p><Link href="/calendar" className="fc-focus-inline-action"><CalendarDays size={17} aria-hidden /> View schedule <ArrowRight size={16} aria-hidden /></Link></section>
      <section className="fc-panel"><SectionHeader title="Circle, now" href="/circle" actionLabel="Open Circle" />{firstPost ? <div className="fc-focus-post"><UsersRound size={18} aria-hidden /><div><strong>{firstPost.profiles?.display_name ?? "Healthy Life"}</strong><p>{firstPost.body}</p><small>{offlinePreview ? "Fictional preview post" : "Community post"}</small></div></div> : <p className="fc-focus-panel-copy">Find your people and share a small win.</p>}</section>
    </div></div>
    <LocalDataNote>{offlinePreview ? "The people, posts, and starter sessions shown here are fictional examples. Saving needs local Supabase." : "Community and starter content is sample data; your private activity is saved to your account."}</LocalDataNote>
  </div>;
}
