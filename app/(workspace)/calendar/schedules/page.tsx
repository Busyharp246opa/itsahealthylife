import Link from "next/link";
import { CalendarDays, Link2 } from "lucide-react";
import { dubaiToday, getMyWeeklyTraining } from "../../../../lib/weekly-training";
import { CopyScheduleLink, CreateTrainingScheduleForm, DeleteTrainingScheduleForm, SelectTrainingScheduleForm, ToggleScheduleShareForm } from "../../../components/weekly-training-forms";
import { EmptyState, LocalDataNote, PageHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "My schedules" };

export default async function MySchedulesPage() {
  const { programs, schedules } = await getMyWeeklyTraining();
  const names = new Map(programs.map((program) => [program.id, program.title]));
  return <div className="fc-page"><PageHeader eyebrow="Schedule · my plans" title="Choose what you follow." description="Make a schedule from one of your weekly programs. You can keep several schedules and select the one that shapes your current week." backHref="/calendar" actions={<Link className="fc-button fc-button--quiet" href="/train/my-programs">Edit my programs</Link>} />
    <LocalDataNote>Schedules are private by default. A share link shows only the selected schedule and exercise plan; turning it off immediately invalidates the link.</LocalDataNote>
    <div className="fc-training-index"><section className="fc-panel"><h2><CalendarDays size={19} aria-hidden /> New exercise schedule</h2>{programs.length ? <CreateTrainingScheduleForm programs={programs} today={dubaiToday()} /> : <><p>First create a program with the exercises you want on each day.</p><Link className="fc-button fc-button--primary" href="/train/my-programs">Create a program</Link></>}</section>
      <section className="fc-panel"><h2>Saved schedules</h2>{schedules.length ? <div className="fc-training-schedules">{schedules.map((schedule) => <article key={schedule.id} className="fc-training-schedule-card"><div className="fc-training-schedule-heading"><div><strong>{schedule.title}</strong><p>Following <Link href={`/train/my-programs/${schedule.program_id}`}>{names.get(schedule.program_id) ?? "My program"}</Link> · starts {schedule.starts_on}</p></div>{schedule.is_active ? <StatusBadge tone="success">Following now</StatusBadge> : null}</div><div className="fc-training-schedule-actions">{!schedule.is_active ? <SelectTrainingScheduleForm scheduleId={schedule.id} /> : null}<ToggleScheduleShareForm scheduleId={schedule.id} shared={!!schedule.share_token} /></div>{schedule.share_token ? <div className="fc-training-share-link"><Link2 size={16} aria-hidden /><Link href={`/calendar/shared/${schedule.share_token}`} target="_blank" rel="noreferrer">Open read-only schedule</Link><CopyScheduleLink token={schedule.share_token} /></div> : null}<details><summary>Remove schedule</summary><DeleteTrainingScheduleForm scheduleId={schedule.id} /></details></article>)}</div> : <EmptyState title="No schedules yet" description="Choose a program on the left and set the date you want to start." />}</section></div>
  </div>;
}
