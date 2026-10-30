import Link from "next/link";
import type { WeeklyProgram } from "../../lib/weekly-training";
import { WEEKDAYS, dubaiToday, shiftWeek, weekDates } from "../../lib/weekly-training";

export function TrainingWeekNavigation({ monday, baseHref }: { monday: string; baseHref: string }) {
  const days = weekDates(monday);
  const currentMonday = weekDates()[0];
  const label = `${new Intl.DateTimeFormat("en-AE", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${days[0]}T12:00:00Z`))} – ${new Intl.DateTimeFormat("en-AE", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${days[6]}T12:00:00Z`))}`;
  return <nav className="fc-training-week-nav" aria-label="Training weeks"><Link href={`${baseHref}?week=${shiftWeek(monday, -1)}`}>← Previous week</Link><strong>{label}</strong><div>{monday !== currentMonday ? <Link href={baseHref}>This week</Link> : null}<Link href={`${baseHref}?week=${shiftWeek(monday, 1)}`}>Next week →</Link></div></nav>;
}

export function TrainingWeek({ program, startsOn, monday }: { program: WeeklyProgram; startsOn: string; monday?: string }) {
  const dates = weekDates(monday);
  const today = dubaiToday();
  return <div className="fc-training-week-grid fc-training-week-grid--view">{dates.map((date, index) => {
    const day = program.trainee_program_days.find((item) => item.weekday === index + 1);
    const pending = date < startsOn;
    return <article className={`fc-training-day${date === today ? " is-today" : ""}`} key={date}><div className="fc-training-day-head"><div><span>{new Intl.DateTimeFormat("en-AE", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`))}</span><h2>{WEEKDAYS[index]}</h2></div><strong>{pending ? "Before start" : day?.label ?? "Rest day"}</strong></div>
      {pending ? <p className="fc-training-empty-day">Your schedule begins {startsOn}.</p> : day?.trainee_program_movements.length ? <ol className="fc-training-view-list">{day.trainee_program_movements.map((item) => <li key={item.id}><strong>{item.exercise_catalog?.name ?? item.trainee_exercises?.name ?? "Exercise"}</strong><span>{item.target_sets} × {item.target_reps}</span>{item.notes ? <small>{item.notes}</small> : null}</li>)}</ol> : <p className="fc-training-empty-day">Recovery or open training day</p>}
    </article>;
  })}</div>;
}
