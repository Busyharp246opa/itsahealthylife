import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronRight, Plus } from "lucide-react";
import { getMyWeeklyProgram, WEEKDAYS } from "../../../../../lib/weekly-training";
import { DeleteWeeklyProgramForm, MovementTargetsForm, ProgramDayForm, RemoveProgramMovementForm, WeeklyProgramDetailsForm } from "../../../../components/weekly-training-forms";
import { LocalDataNote, PageHeader, StatusBadge } from "../../../../components/workspace-ui";

export default async function MyProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { program, schedules } = await getMyWeeklyProgram(id);
  if (!program) notFound();
  const current = schedules.find((schedule) => schedule.is_active && schedule.program_id === program.id);
  return <div className="fc-page">
    <PageHeader eyebrow="My weekly program" title={program.title} description={program.description || "Build each day in the order you want to train."} backHref="/train/my-programs" actions={<Link className="fc-button fc-button--primary" href="/calendar/schedules"><CalendarDays size={16} aria-hidden /> {current ? "View my schedule" : "Put on schedule"}</Link>} />
    <LocalDataNote>Changes to this program appear in every schedule that follows it. The seven days repeat each week after a schedule starts.</LocalDataNote>
    <div className="fc-training-week-grid">{program.trainee_program_days.map((day) => <section className="fc-training-day" key={day.id}>
      <div className="fc-training-day-head"><div><span>Day {day.weekday.toString().padStart(2, "0")}</span><h2>{WEEKDAYS[day.weekday - 1]}</h2></div><StatusBadge tone={day.trainee_program_movements.length ? "accent" : "neutral"}>{day.trainee_program_movements.length ? `${day.trainee_program_movements.length} exercises` : "Rest / open"}</StatusBadge></div>
      <ProgramDayForm programId={program.id} dayId={day.id} label={day.label} />
      {day.trainee_program_movements.length ? <ol className="fc-training-movements">{day.trainee_program_movements.map((movement) => {
        const exercise = movement.exercise_catalog ?? movement.trainee_exercises;
        return <li key={movement.id}><div className="fc-training-movement-head"><span>{movement.position.toString().padStart(2, "0")}</span><div><strong>{exercise?.name ?? "Exercise"}</strong><small>{exercise?.target || "Custom"} · {exercise?.equipment || "No equipment listed"}</small></div><RemoveProgramMovementForm programId={program.id} dayId={day.id} movementId={movement.id} /></div><MovementTargetsForm programId={program.id} dayId={day.id} movement={movement} /></li>;
      })}</ol> : <p className="fc-training-empty-day">Leave this day open for recovery, or add your first exercise.</p>}
      <Link className="fc-training-add-link" href={`/train/my-programs/${program.id}/add?day=${day.weekday}`}><Plus size={17} aria-hidden /> Add exercises <ChevronRight size={16} aria-hidden /></Link>
    </section>)}</div>
    <details className="fc-panel fc-training-edit-details"><summary>Edit program name and note</summary><WeeklyProgramDetailsForm program={program} /></details>
    <details className="fc-panel fc-training-edit-details"><summary>Delete this program</summary><p>Remove its schedules first. Deleting the program also deletes its day plans.</p><DeleteWeeklyProgramForm programId={program.id} /></details>
  </div>;
}
