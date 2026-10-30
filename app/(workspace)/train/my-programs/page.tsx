import Link from "next/link";
import { CalendarDays, ChevronRight, Dumbbell, Plus } from "lucide-react";
import { getMyWeeklyTraining } from "../../../../lib/weekly-training";
import { CreateWeeklyProgramForm } from "../../../components/weekly-training-forms";
import { EmptyState, LocalDataNote, PageHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "My programs" };

export default async function MyProgramsPage() {
  const { programs, schedules } = await getMyWeeklyTraining();
  return <div className="fc-page">
    <PageHeader eyebrow="Training · my programs" title="Build a week that fits you." description="Name your program, plan each day, then choose it in your schedule. Use catalog movements or create your own." backHref="/train" actions={<Link className="fc-button fc-button--quiet" href="/calendar/schedules"><CalendarDays size={16} aria-hidden /> My schedules</Link>} />
    <LocalDataNote>Your programs and custom exercises are private. An approved trainer sees them only while you turn on the existing “Share with my trainer” setting.</LocalDataNote>
    <div className="fc-training-index">
      <section className="fc-panel"><h2><Plus size={19} aria-hidden /> Start a program</h2><p>Every new program has Monday through Sunday ready to fill. Rest days can stay empty.</p><CreateWeeklyProgramForm /></section>
      <section className="fc-panel"><h2>Your programs</h2>{programs.length ? <div className="fc-training-program-list">{programs.map((program) => {
        const planned = program.trainee_program_days.filter((day) => day.trainee_program_movements.length).length;
        const following = schedules.some((schedule) => schedule.is_active && schedule.program_id === program.id);
        return <Link href={`/train/my-programs/${program.id}`} className="fc-training-program-row" key={program.id}><div><strong>{program.title}</strong><p>{program.description || "Your editable weekly plan"}</p><small>{planned} training {planned === 1 ? "day" : "days"} · {program.trainee_program_days.reduce((sum, day) => sum + day.trainee_program_movements.length, 0)} exercises</small></div>{following ? <StatusBadge tone="success">Following</StatusBadge> : null}<ChevronRight size={19} aria-hidden /></Link>;
      })}</div> : <EmptyState title="No weekly programs yet" description="Create one here, or copy a starter program and make it yours." />}{!programs.length ? <Link className="fc-button fc-button--quiet" href="/train/programs"><Dumbbell size={16} aria-hidden /> Explore starter programs</Link> : null}</section>
    </div>
  </div>;
}
