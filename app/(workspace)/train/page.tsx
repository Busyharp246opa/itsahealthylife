import Link from "next/link";
import { BookOpen, CalendarDays, Search, Timer } from "lucide-react";
import { getTrainingData } from "../../../lib/fitcircle-data";
import { getMyWeeklyTraining } from "../../../lib/weekly-training";
import { CopyWorkoutForm } from "../../components/mutation-forms";
import { LocalDataNote, PageHeader, SectionHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  const [data, weekly] = await Promise.all([getTrainingData(), getMyWeeklyTraining()]);
  const activeSchedule = weekly.schedules.find((item) => item.is_active);
  const activeProgram = weekly.programs.find((item) => item.id === activeSchedule?.program_id);
  return <div className="fc-page fc-train-hub">
    <PageHeader eyebrow="Training" title="What are you training today?" description="Find a movement, continue your plan, or start a new one." />

    <section className="fc-exercise-entry" aria-labelledby="browse-exercises-title">
      <div className="fc-exercise-entry__copy"><Search size={28} aria-hidden /><div><h2 id="browse-exercises-title">Browse exercises</h2><p>{data.catalogCount.toLocaleString()} movements with category, target, equipment, and step-by-step technique data.</p></div></div>
      <form action="/train/exercises" className="fc-exercise-entry__search"><label><span>Search by exercise name</span><input name="q" placeholder="e.g. barbell squat" /></label><button className="fc-button fc-button--primary" type="submit">Search exercises</button></form>
      <nav className="fc-category-links" aria-label="Browse exercise categories">{data.categories.map((category) => <Link key={category.name} href={`/train/exercises?category=${encodeURIComponent(category.name)}`}><span>{category.name}</span><strong>{category.count}</strong></Link>)}</nav>
      <Link href="/train/exercises" className="fc-button fc-button--quiet">Browse all exercises</Link>
    </section>
    <nav className="fc-train-shortcuts" aria-label="Training shortcuts"><Link href="/train/my-programs"><BookOpen size={21} aria-hidden /><span><strong>My programs</strong><small>{weekly.programs.length} saved</small></span></Link><Link href="/calendar/schedules"><CalendarDays size={21} aria-hidden /><span><strong>My schedules</strong><small>{weekly.schedules.length} saved</small></span></Link><Link href="/train/exercises"><Search size={21} aria-hidden /><span><strong>All exercises</strong><small>{data.catalogCount.toLocaleString()} movements</small></span></Link></nav>
    <section className="fc-training-hero"><div><span className="fc-training-eyebrow">Your weekly plan</span><h2>{activeSchedule ? activeSchedule.title : "A week you can make your own."}</h2><p>{activeSchedule ? `Following ${activeProgram?.title ?? "your program"} from ${activeSchedule.starts_on}. Review your days, change exercises, or choose another schedule.` : "Create a seven-day program, add catalog or custom exercises, then put it on your schedule."}</p><div className="fc-training-hero-actions"><Link href="/train/my-programs" className="fc-button fc-button--primary"><BookOpen size={16} aria-hidden /> {weekly.programs.length ? "My programs" : "Create a program"}</Link><Link href="/calendar/schedules" className="fc-button fc-button--quiet"><CalendarDays size={16} aria-hidden /> My schedules</Link></div></div><div className="fc-training-hero-count"><strong>{weekly.programs.length}</strong><span>custom {weekly.programs.length === 1 ? "program" : "programs"}</span><strong>{weekly.schedules.length}</strong><span>saved {weekly.schedules.length === 1 ? "schedule" : "schedules"}</span></div></section>
    <details className="fc-train-collection"><summary>Starter sessions <span>{data.workouts.length} templates</span></summary><section className="fc-surface-rail"><SectionHeader title="Starter sessions" description="Copy a session to make your own draft." href="/train/workouts" /><div className="fc-workout-grid">{data.workouts.map((workout) => <article className="fc-workout-card" key={workout.id}><Link href={`/train/workouts/${workout.id}`}><div><StatusBadge tone="accent">{workout.duration_minutes} min</StatusBadge><Timer size={18} aria-hidden /></div><h3>{workout.name}</h3><ol>{workout.workout_exercises.slice(0, 4).map((item) => <li key={item.id}><span>{item.exercise_catalog?.name}</span><small>{item.target_sets} × {item.target_reps}</small></li>)}</ol></Link><CopyWorkoutForm templateId={workout.id} /></article>)}</div></section></details>
    <details className="fc-train-collection"><summary>Explore programs <span>{data.programs.length} programs</span></summary><section className="fc-surface-rail"><SectionHeader title="Programs" description="Explore the plan before committing to it." href="/train/programs" /><div className="fc-program-rail">{data.programs.map((program) => <Link href={`/train/programs/${program.slug}`} className={`fc-program-card fc-tone-${program.accent}`} key={program.id}><span>{program.level}</span><h3>{program.title}</h3><p>{program.summary}</p><div><strong>{program.weeks} weeks</strong><small>{program.sessions_per_week} sessions / week</small></div></Link>)}</div></section></details>
    <LocalDataNote>Exercise data is pinned to source commit 7455efae. Restricted third-party media requires separate permission.</LocalDataNote>
  </div>;
}
