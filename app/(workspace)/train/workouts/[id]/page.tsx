import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock3, Dumbbell } from "lucide-react";
import { getWorkout } from "../../../../../lib/fitcircle-data";
import { CopyWorkoutForm, DeleteWorkoutForm, RemoveMovementForm, WorkoutDetailsForm, WorkoutSetForm, WorkoutStatusForm } from "../../../../components/mutation-forms";
import { EmptyState, LocalDataNote, PageHeader, StatusBadge } from "../../../../components/workspace-ui";

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();
  const movements = [...workout.workout_exercises].sort((a, b) => a.position - b.position);
  const draft = !workout.is_template && workout.status === "draft";
  const active = !workout.is_template && workout.status === "active";
  const completed = !workout.is_template && workout.status === "completed";

  return <div className="fc-page">
    <PageHeader eyebrow={workout.is_template ? "Workout template" : "Your private workout"} title={workout.name} description={workout.is_template ? "Review the order and targets, then copy this session into your private drafts." : "Build your session, log each set, and return to the completed record at any time."} backHref="/train/workouts" actions={workout.is_template ? <CopyWorkoutForm templateId={workout.id} /> : null} />
    <LocalDataNote>{workout.is_template ? "This starter session is synthetic and can be copied without changing the template." : "Only this local identity can read or change its workout and sets."}</LocalDataNote>

    <div className="fc-workout-detail">
      <section className="fc-session-summary"><span><Clock3 size={19} aria-hidden /> {workout.is_template ? "Planned time" : "Session state"}</span><strong>{workout.is_template ? `${workout.duration_minutes ?? "—"} min` : workout.status}</strong><p>{workout.notes || "A private plan you can adjust before starting."}</p><StatusBadge tone="accent">{movements.length} movements</StatusBadge>{draft && movements.length ? <WorkoutStatusForm workoutId={workout.id} intent="start">Start workout</WorkoutStatusForm> : null}{active ? <WorkoutStatusForm workoutId={workout.id} intent="complete">Finish workout</WorkoutStatusForm> : null}{completed ? <WorkoutStatusForm workoutId={workout.id} intent="reopen">Reopen for corrections</WorkoutStatusForm> : null}</section>

      <section className="fc-panel"><h2>Movement order</h2>{movements.length ? <ol className="fc-workout-order">{movements.map((item) => <li key={item.id}><span>{String(item.position).padStart(2, "0")}</span><div><Link href={`/train/exercises/${item.exercise_catalog?.id}`}><h3>{item.exercise_catalog?.name}</h3></Link><p>{item.exercise_catalog?.target} · {item.exercise_catalog?.equipment}</p><small>{item.target_sets} planned sets · {item.rest_seconds}s rest</small>{draft ? <RemoveMovementForm workoutId={workout.id} workoutExerciseId={item.id} /> : null}{active ? <div className="fc-set-list">{Array.from({ length: Math.min(item.target_sets, 20) }, (_, index) => { const setNumber = index + 1; const current = item.workout_sets.find((set) => set.set_number === setNumber); return <WorkoutSetForm key={setNumber} workoutId={workout.id} workoutExerciseId={item.id} setNumber={setNumber} current={current} />; })}</div> : null}{completed ? <ul className="fc-logged-sets">{item.workout_sets.sort((a, b) => a.set_number - b.set_number).map((set) => <li key={set.id}>Set {set.set_number}: {set.weight_kg ?? 0} kg × {set.reps ?? 0} reps{set.rpe === null ? "" : ` · RPE ${set.rpe}`}{set.is_warmup ? " · warm-up" : ""}</li>)}</ul> : null}</div><strong>{item.target_sets} × {item.target_reps}</strong></li>)}</ol> : <EmptyState title="No movements yet" description="Find an exercise and add it to this draft." />}{draft ? <Link href="/train/exercises" className="fc-button fc-button--quiet">Browse movements to add</Link> : null}{workout.is_template ? <p className="fc-helper"><Dumbbell size={15} aria-hidden /> Copy this template to log your own weights and repetitions.</p> : null}</section>
    </div>
    {draft ? <section className="fc-panel"><h2>Edit draft details</h2><WorkoutDetailsForm workout={workout} /></section> : null}
    {!workout.is_template ? <section className="fc-panel"><h2>Remove workout</h2><p>Deleting this private record also removes its movements and logged sets.</p><DeleteWorkoutForm workoutId={workout.id} /></section> : null}
  </div>;
}
