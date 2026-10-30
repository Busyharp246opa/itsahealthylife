import Link from "next/link";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { getExerciseCatalog } from "../../../../../../lib/fitcircle-data";
import { getMyWeeklyProgram, WEEKDAYS } from "../../../../../../lib/weekly-training";
import { AddCatalogMovementForm, AddCustomMovementForm, ReuseCustomMovementForm } from "../../../../../components/weekly-training-forms";
import { LocalDataNote, PageHeader } from "../../../../../components/workspace-ui";

export default async function AddProgramExercisePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ day?: string; q?: string; page?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const weekday = Number(query.day);
  const { program, exercises } = await getMyWeeklyProgram(id);
  const day = program?.trainee_program_days.find((item) => item.weekday === weekday);
  if (!program || !day) notFound();
  const catalog = await getExerciseCatalog({ query: query.q, page: Number(query.page ?? 0) });
  const pageHref = (page: number) => `/train/my-programs/${id}/add?${new URLSearchParams({ day: String(weekday), ...(query.q ? { q: query.q } : {}), page: String(page) })}`;
  return <div className="fc-page">
    <PageHeader eyebrow={`${program.title} · ${WEEKDAYS[weekday - 1]}`} title="Add exercises to this day." description="Search the movement library or save an exercise of your own. New exercises are added to the end of this day." backHref={`/train/my-programs/${id}`} actions={<Link className="fc-button fc-button--quiet" href={`/train/my-programs/${id}`}>Done adding</Link>} />
    <LocalDataNote>Catalog technique text is reference material. Your own exercise notes stay private unless you explicitly share the schedule.</LocalDataNote>
    <div className="fc-training-picker-grid"><section className="fc-panel"><h2>Choose from the catalog</h2><form className="fc-training-search"><input type="hidden" name="day" value={weekday} /><label><span>Exercise name</span><div><Search size={17} aria-hidden /><input name="q" defaultValue={query.q} placeholder="Search 1,324 exercises" /></div></label><button type="submit" className="fc-button fc-button--primary">Search</button></form><p className="fc-helper">{catalog.count.toLocaleString()} matching exercises · page {catalog.page + 1}</p><div className="fc-training-picker-results">{catalog.exercises.map((exercise) => <article key={exercise.id}><div><strong>{exercise.name}</strong><small>{exercise.target} · {exercise.equipment}</small></div><AddCatalogMovementForm programId={program.id} dayId={day.id} exerciseId={exercise.id} /></article>)}</div>{!catalog.exercises.length ? <p>No exercises match. Try a shorter name or create your own.</p> : null}<nav className="fc-training-pagination" aria-label="Exercise result pages"><Link href={pageHref(Math.max(0, catalog.page - 1))} aria-disabled={catalog.page === 0}>Previous</Link><span>{catalog.page + 1} / {Math.max(1, Math.ceil(catalog.count / catalog.pageSize))}</span><Link href={pageHref(catalog.page + 1)} aria-disabled={(catalog.page + 1) * catalog.pageSize >= catalog.count}>Next</Link></nav></section>
      <aside className="fc-training-custom-column"><section className="fc-panel"><h2>Create your own exercise</h2><p>Save it once and reuse it in any program day.</p><AddCustomMovementForm programId={program.id} dayId={day.id} /></section>{exercises.length ? <section className="fc-panel"><h2>Reuse a saved exercise</h2><ReuseCustomMovementForm programId={program.id} dayId={day.id} exercises={exercises} /></section> : null}</aside>
    </div>
  </div>;
}
