import Link from "next/link";
import { getMyWorkouts, getWellnessData } from "../../../lib/fitcircle-data";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { IntakeChart, ReadinessChart, VolumeChart } from "../../components/progress-charts";
import { LoadDemoHistoryForm } from "../../components/mutation-forms";
import { EmptyState, LocalDataNote, PageHeader, SectionHeader } from "../../components/workspace-ui";

export const metadata = { title: "Insights" };

function label(day: string) {
  return new Intl.DateTimeFormat("en-AE", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

export default async function InsightsPage() {
  const [wellness, workouts, offlinePreview] = await Promise.all([getWellnessData(), getMyWorkouts(), isOfflinePreview()]);
  const readiness = [...wellness.checkins].reverse().map((entry) => ({ date: entry.checked_on, label: label(entry.checked_on), mood: entry.mood, energy: entry.energy }));
  const dailyIntake = new Map<string, number>();
  for (const meal of wellness.meals) {
    const day = meal.eaten_at.slice(0, 10);
    dailyIntake.set(day, (dailyIntake.get(day) ?? 0) + meal.meal_items.reduce((sum, item) => sum + Number(item.calories ?? 0), 0));
  }
  const intake = [...dailyIntake].sort(([a], [b]) => a.localeCompare(b)).map(([date, calories]) => ({ date, label: label(date), calories }));
  const volume = workouts.filter((workout) => workout.status === "completed" && workout.completed_at).sort((a, b) => a.completed_at!.localeCompare(b.completed_at!)).map((workout) => ({
    date: workout.completed_at!.slice(0, 10),
    label: label(workout.completed_at!.slice(0, 10)),
    volume: workout.workout_exercises.flatMap((movement) => movement.workout_sets).reduce((sum, set) => sum + Number(set.weight_kg ?? 0) * Number(set.reps ?? 0), 0),
  }));
  const hasData = readiness.length || intake.length || volume.length;
  return <div className="fc-page"><PageHeader eyebrow="Private progress" title="See the pattern in your logs." description={offlinePreview ? "Explore fictional check-ins, meals, and training sets in the chart layout." : "Charts are calculated from this account’s saved check-ins, meals, and completed sets."} />
    <LocalDataNote>{offlinePreview ? "These chart values are synthetic offline preview examples. They are not saved to an account." : wellness.demoLoaded ? "This account includes clearly marked synthetic sample history. New entries appear in the same charts." : "No data is inferred or generated from your activity. Add entries to build your own history."}</LocalDataNote>
    {!wellness.demoLoaded ? <section className="fc-panel"><SectionHeader title="Explore with sample history" description="Loads seven fictional check-ins, three sample meals, and three completed workouts once for this local account." /><LoadDemoHistoryForm /></section> : null}
    {!hasData ? <EmptyState title="No progress data yet" description="Save a check-in, meal, or completed workout, or load the labelled sample history above." /> : null}
    <div className="fc-insights-grid">
      <section className="fc-panel"><SectionHeader title="Mood and energy" description="Self-reported scores from 1 to 5; no readiness diagnosis." href="/wellness" />{readiness.length ? <><ReadinessChart data={readiness} /><table className="fc-chart-table"><caption>Recorded readiness values</caption><thead><tr><th>Date</th><th>Mood</th><th>Energy</th></tr></thead><tbody>{readiness.map((point) => <tr key={point.date}><td>{point.label}</td><td>{point.mood}</td><td>{point.energy}</td></tr>)}</tbody></table></> : <p>No check-ins saved.</p>}</section>
      <section className="fc-panel"><SectionHeader title="Food values entered" description="Incomplete days show only logged foods; this is not a daily calorie target." href="/wellness" />{intake.length ? <><IntakeChart data={intake} /><table className="fc-chart-table"><caption>Entered calories by day</caption><thead><tr><th>Date</th><th>Logged kcal</th></tr></thead><tbody>{intake.map((point) => <tr key={point.date}><td>{point.label}</td><td>{point.calories}</td></tr>)}</tbody></table></> : <p>No meals saved.</p>}</section>
      <section className="fc-panel"><SectionHeader title="Strength volume" description="Sum of logged kilograms multiplied by repetitions; bodyweight sets contribute zero." href="/train/workouts" />{volume.length ? <><VolumeChart data={volume} /><table className="fc-chart-table"><caption>Logged training volume by session</caption><thead><tr><th>Date</th><th>Volume</th></tr></thead><tbody>{volume.map((point, index) => <tr key={`${point.date}-${index}`}><td>{point.label}</td><td>{point.volume} kg × reps</td></tr>)}</tbody></table></> : <p>No completed workouts with logged sets.</p>}</section>
    </div><p className="fc-privacy-line">For details and edits, open <Link href="/wellness">wellness</Link> or <Link href="/train/workouts">workouts</Link>.</p>
  </div>;
}
