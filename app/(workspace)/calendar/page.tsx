import Link from "next/link";
import { CalendarDays, Clock3, Dumbbell, UserRound } from "lucide-react";
import { getCalendarData } from "../../../lib/fitcircle-data";
import { dubaiToday, getMyWeeklyTraining, selectedWeek, weekDates } from "../../../lib/weekly-training";
import { TrainingWeek, TrainingWeekNavigation } from "../../components/training-week";
import { LocalDataNote, PageHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const query = await searchParams;
  const [data, weekly] = await Promise.all([getCalendarData(), getMyWeeklyTraining()]);
  const activeSchedule = weekly.schedules.find((item) => item.is_active);
  const activeProgram = weekly.programs.find((item) => item.id === activeSchedule?.program_id);
  const today = dubaiToday();
  const monday = selectedWeek(query.week);
  const days = weekDates(monday);

  return <div className="fc-page">
    <PageHeader eyebrow="Schedule · Asia/Dubai" title="The week has a visible shape." description="Follow the exercise program you chose, review each day, and share a read-only copy when you want to." actions={<Link className="fc-button fc-button--primary" href="/calendar/schedules"><CalendarDays size={16} aria-hidden /> Manage schedules</Link>} />
    <LocalDataNote>Your own program is private until you enable a share link or turn on trainee-to-trainer sharing. Starter session examples below are fictional.</LocalDataNote>
    <div className="fc-week-strip">{days.map((date) => { const day = new Date(`${date}T12:00:00Z`); return <div className={date === today ? "is-today" : ""} key={date}><span>{new Intl.DateTimeFormat("en-AE", { weekday: "short", timeZone: "UTC" }).format(day)}</span><strong>{day.getUTCDate()}</strong></div>; })}</div>
    <section className="fc-training-calendar-section"><div className="fc-training-section-head"><div><span className="fc-training-eyebrow">Your exercise schedule</span><h2>{activeSchedule?.title ?? "Choose a program to follow"}</h2><p>{activeProgram ? `${activeProgram.title} · repeats weekly from ${activeSchedule?.starts_on}` : "Build a seven-day program, then make a schedule from it."}</p></div><Link className="fc-button fc-button--quiet" href={activeProgram ? `/train/my-programs/${activeProgram.id}` : "/train/my-programs"}>{activeProgram ? "Edit program" : "Build a program"}</Link></div>{activeProgram && activeSchedule ? <><TrainingWeekNavigation monday={monday} baseHref="/calendar" /><TrainingWeek program={activeProgram} startsOn={activeSchedule.starts_on} monday={monday} /></> : <p className="fc-training-empty-day">Your planned exercises will appear here once you follow a schedule.</p>}</section>
    <div className="fc-calendar-columns">
      <section className="fc-panel"><h2>Workout appointments and starter examples</h2><div className="fc-agenda">{data.workouts.map((workout) => <Link href={`/train/workouts/${workout.id}`} key={workout.id}><span className="fc-agenda-time"><Clock3 size={14} aria-hidden />{new Intl.DateTimeFormat("en-AE", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Dubai" }).format(new Date(workout.scheduled_for ?? ""))}</span><i className="fc-agenda-mark fc-agenda-mark--workout" /><div><strong>{workout.name}</strong><small>{workout.is_template ? "Fictional starter template" : "Your workout"} · {workout.duration_minutes} min</small></div><Dumbbell size={17} aria-hidden /></Link>)}</div></section>
      <section className="fc-panel"><h2>Open coach times</h2><div className="fc-agenda">{data.availability.map((slot) => <Link href={`/coaches/${slot.coach_profiles?.id}`} key={slot.id}><span className="fc-agenda-time"><Clock3 size={14} aria-hidden />{new Intl.DateTimeFormat("en-AE", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: slot.timezone }).format(new Date(slot.starts_at))}</span><i className="fc-agenda-mark fc-agenda-mark--coach" /><div><strong>{slot.coach_profiles?.profiles?.display_name ?? "Coach"}</strong><small>Available · {slot.timezone}</small></div><UserRound size={17} aria-hidden /></Link>)}</div></section>
    </div>
    {data.bookings.length ? <section className="fc-panel"><h2>Your booking requests</h2>{data.bookings.map((booking) => <p key={booking.id}><CalendarDays size={16} aria-hidden />{booking.coach_profiles?.profiles?.display_name} · {booking.starts_at} · <StatusBadge>{booking.status}</StatusBadge></p>)}</section> : null}
  </div>;
}
