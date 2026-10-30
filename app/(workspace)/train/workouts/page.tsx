import Link from "next/link";
import { getMyWorkouts, getTrainingData } from "../../../../lib/fitcircle-data";
import { CopyWorkoutForm, CreateWorkoutForm } from "../../../components/mutation-forms";
import { EmptyState, LocalDataNote, PageHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Workouts" };

export default async function WorkoutsPage() {
  const [{ workouts: templates }, myWorkouts] = await Promise.all([getTrainingData(), getMyWorkouts()]);
  const active = myWorkouts.filter((workout) => workout.status !== "completed" && workout.status !== "cancelled");
  const history = myWorkouts.filter((workout) => workout.status === "completed");

  return <div className="fc-page">
    <PageHeader eyebrow="Training · sessions" title="Your training, set by set." description="Create a private workout or copy a starter session, then log sets and review completed work." backHref="/train" />
    <LocalDataNote>Starter sessions are synthetic. Your draft and set logs belong only to this local identity.</LocalDataNote>

    <section className="fc-panel"><h2>Create a workout</h2><p>Start with an empty draft, then add movements from the catalog.</p><CreateWorkoutForm /></section>

    <section className="fc-surface-rail"><h2>In progress</h2>{active.length ? <div className="fc-workout-grid fc-workout-grid--wide">{active.map((workout) => <article className="fc-workout-card" key={workout.id}><Link href={`/train/workouts/${workout.id}`}><StatusBadge tone="accent">{workout.status}</StatusBadge><h3>{workout.name}</h3><p>{workout.workout_exercises.length} movements · {workout.workout_exercises.reduce((count, item) => count + item.workout_sets.length, 0)} sets logged</p><span className="fc-button fc-button--quiet">Open workout</span></Link></article>)}</div> : <EmptyState title="No private workouts yet" description="Create a draft or copy a starter session below." />}</section>

    <section className="fc-surface-rail"><h2>Starter sessions</h2><div className="fc-workout-grid fc-workout-grid--wide">{templates.map((workout) => <article className="fc-workout-card" key={workout.id}><Link href={`/train/workouts/${workout.id}`}><div><StatusBadge tone="accent">{workout.duration_minutes} min</StatusBadge><StatusBadge>Template</StatusBadge></div><h3>{workout.name}</h3><ol>{workout.workout_exercises.map((item) => <li key={item.id}><span>{item.exercise_catalog?.name}</span><small>{item.target_sets} × {item.target_reps}</small></li>)}</ol></Link><CopyWorkoutForm templateId={workout.id} /></article>)}</div></section>

    <section className="fc-surface-rail"><h2>Completed history</h2>{history.length ? <div className="fc-workout-grid fc-workout-grid--wide">{history.map((workout) => <article className="fc-workout-card" key={workout.id}><Link href={`/train/workouts/${workout.id}`}><StatusBadge tone="success">Completed</StatusBadge><h3>{workout.name}</h3><p>{workout.completed_at ? new Intl.DateTimeFormat("en-AE", { dateStyle: "medium" }).format(new Date(workout.completed_at)) : "Completed locally"} · {workout.workout_exercises.reduce((count, item) => count + item.workout_sets.length, 0)} sets</p></Link></article>)}</div> : <EmptyState title="History starts with your first session" description="Finish a private workout and it will appear here." />}</section>
  </div>;
}
