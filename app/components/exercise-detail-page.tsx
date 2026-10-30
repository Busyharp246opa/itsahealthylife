import { notFound } from "next/navigation";
import { Dumbbell, ExternalLink, Focus, Languages, Layers3 } from "lucide-react";
import { EXERCISE_LANGUAGES, getExercise, getMyWorkouts } from "../../lib/fitcircle-data";
import { LocalDataNote, PageHeader, StatusBadge } from "./workspace-ui";
import { ExerciseMedia } from "./exercise-media";
import { AddMovementForm } from "./mutation-forms";
import { hasFlowAnimation } from "../../lib/flow-exercise-media";

export async function ExerciseDetailPage({ params, searchParams, basePath = "/train/exercises", allowAdd = true }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }>; basePath?: string; allowAdd?: boolean }) {
  const { id } = await params;
  const query = await searchParams;
  const exercise = await getExercise(id);
  if (!exercise) notFound();
  const drafts = allowAdd ? (await getMyWorkouts()).filter((workout) => workout.status === "draft").map(({ id: workoutId, name }) => ({ id: workoutId, name })) : [];
  const language = EXERCISE_LANGUAGES.some((item) => item.code === query.lang) ? query.lang! : "en";
  const languageLabel = EXERCISE_LANGUAGES.find((item) => item.code === language)?.label ?? "English";
  const instructions = exercise.instructions_by_locale[language] ?? exercise.instructions;
  const steps = exercise.instruction_steps_by_locale[language] ?? exercise.steps;
  return <div className="fc-page">
    <PageHeader eyebrow={`Exercise ${exercise.id}`} title={exercise.name} description={instructions} backHref={basePath} />
    <LocalDataNote>Exercise details and ten translations come from the pinned catalog. {hasFlowAnimation(exercise.id) ? "The moving artwork is an illustrative preview; follow the written steps for technique." : "This movement has a written walkthrough without an illustrative preview."}</LocalDataNote>
    <div className="fc-detail-grid">
      <section className="fc-exercise-figure"><ExerciseMedia exercise={exercise} kind="animation" steps={steps} /><div><StatusBadge tone="accent">{exercise.category}</StatusBadge><h2>{exercise.target}</h2><p>Primary target · {exercise.equipment}</p></div></section>
      <section className="fc-panel">
        <form className="fc-language-form"><label><span><Languages size={16} aria-hidden /> Instruction language</span><select name="lang" defaultValue={language}>{EXERCISE_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label><button className="fc-button fc-button--quiet" type="submit">View translation</button></form>
        <h2>Movement profile</h2><dl className="fc-detail-list"><div><dt><Dumbbell size={16} aria-hidden /> Equipment</dt><dd>{exercise.equipment}</dd></div><div><dt><Focus size={16} aria-hidden /> Supporting group</dt><dd>{exercise.muscle_group}</dd></div><div><dt><Layers3 size={16} aria-hidden /> Secondary muscles</dt><dd>{exercise.secondary_muscles.join(" · ") || "—"}</dd></div></dl>
        <div className="fc-technique-head"><div><h2>Technique sequence</h2><p>{languageLabel} · {steps.length} steps</p></div></div>
        <ol className="fc-step-list" lang={language}>{steps.map((step, index) => <li key={`${index}-${step}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
        {allowAdd ? <div className="fc-exercise-add"><h2>Use this movement</h2><AddMovementForm exerciseId={exercise.id} drafts={drafts} /></div> : null}
        <aside className="fc-exercise-source"><div><h2>Source and media rights</h2><p>Catalog text is MIT-licensed. Flow artwork is offered under CC0 to the extent of its creator’s rights. Its provenance and exercise form have not been fully verified. Treat the animation as an illustration, not a demonstration of safe form or training tempo. Original Gym visual media is not used.</p></div><dl><div><dt>Media ID</dt><dd>{exercise.media_id}</dd></div><div><dt>GIF record</dt><dd>{exercise.gif_path} (not displayed)</dd></div></dl><a href={exercise.source_url} target="_blank" rel="noreferrer">Catalog source <ExternalLink size={14} aria-hidden /></a><a href="https://github.com/ozansozuozgit/flow-exercise-dataset/blob/961bb2739015da373daa43b960c28ee839fe93e6/NOTICE.md" target="_blank" rel="noreferrer">Artwork notice <ExternalLink size={14} aria-hidden /></a></aside>
      </section>
    </div>
  </div>;
}
