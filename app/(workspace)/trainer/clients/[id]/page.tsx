import { notFound } from "next/navigation";
import { getApprovedTrainerSession } from "../../../../../lib/trainer-clients";
import { WEEKDAYS } from "../../../../../lib/weekly-training";
import { TrainerCarePlanForm } from "../../../../components/trainer-care-plan-form";
import { Avatar, PageHeader } from "../../../../components/workspace-ui";

export default async function TrainerClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const session = await getApprovedTrainerSession();
  if (!session) notFound();
  const { db, user } = session;
  const { data: link } = await db.from("trainer_client_links").select("id")
    .eq("trainee_id", id).eq("trainer_id", user.id).eq("active", true).maybeSingle();
  if (!link) notFound();

  const [person, details, goals, workouts, meals, checkins, carePlan, schedule] = await Promise.all([
    db.from("profiles").select("display_name,handle").eq("user_id", id).maybeSingle(),
    db.from("trainee_details").select("fitness_goals,fitness_level,training_preferences,diet_preferences,diet_notes,wellness_notes").eq("owner_id", id).maybeSingle(),
    db.from("goals").select("title,target_value,current_value,unit").eq("owner_id", id).limit(8),
    db.from("workouts").select("name,status,scheduled_for,completed_at").eq("owner_id", id).eq("is_template", false).order("created_at", { ascending: false }).limit(8),
    db.from("meals").select("id,meal_type,eaten_at,notes,meal_items(name,calories,protein_g,carbs_g,fat_g)").eq("owner_id", id).order("eaten_at", { ascending: false }).limit(8),
    db.from("wellness_checkins").select("mood,energy,sleep_hours,soreness,note,checked_on").eq("owner_id", id).order("checked_on", { ascending: false }).limit(8),
    db.from("trainer_client_care_plans").select("training_plan,diet_plan,recovery_plan,other_guidance,updated_at").eq("trainee_id", id).maybeSingle(),
    db.from("trainee_schedules").select("title,starts_on,trainee_programs(title,trainee_program_days(weekday,label,trainee_program_movements(target_sets,target_reps,exercise_catalog(name),trainee_exercises(name))))").eq("owner_id", id).eq("is_active", true).maybeSingle(),
  ]);
  if (!person.data || !details.data) notFound();

  return <div className="fc-page">
    <PageHeader eyebrow="Shared client profile" title={person.data.display_name} description="Review the information this trainee chose to share, then save their client plan." backHref="/trainer/clients" />
    <div className="fc-trainer-client-head"><Avatar name={person.data.display_name} handle={person.data.handle} size="lg" /><p>Shared information updates when the trainee saves it. Your access ends as soon as they turn sharing off.</p></div>
    <section className="fc-panel"><h2>Client plan</h2>{carePlan.data?.updated_at ? <p>Last saved {new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(carePlan.data.updated_at))}</p> : <p>No plan has been saved for this client yet.</p>}<TrainerCarePlanForm traineeId={id} plan={carePlan.data} /></section>
    <section className="fc-panel"><h2>Trainee exercise schedule</h2>{schedule.data?.trainee_programs ? <><p>{schedule.data.title} · {schedule.data.trainee_programs.title} · from {schedule.data.starts_on}</p><div className="fc-training-client-week">{[...schedule.data.trainee_programs.trainee_program_days].sort((a, b) => a.weekday - b.weekday).map((day) => <div key={day.weekday}><strong>{WEEKDAYS[day.weekday - 1]} · {day.label}</strong><p>{day.trainee_program_movements.length ? day.trainee_program_movements.map((item) => `${item.exercise_catalog?.name ?? item.trainee_exercises?.name ?? "Exercise"} (${item.target_sets} × ${item.target_reps})`).join(" · ") : "Rest / open"}</p></div>)}</div></> : <p>No schedule is currently shared by this trainee.</p>}</section>
    <div className="fc-focus-dashboard">
      <section className="fc-panel"><h2>Fitness context</h2><p><strong>Goals:</strong> {details.data.fitness_goals || "No goals entered"}</p><p><strong>Level:</strong> {details.data.fitness_level || "Not entered"}</p><p><strong>Training preferences:</strong> {details.data.training_preferences || "Not entered"}</p><h3>Saved goals</h3>{goals.data?.length ? goals.data.map((goal, index) => <p key={index}>{goal.title} · {goal.current_value}{goal.unit} / {goal.target_value ?? "—"}{goal.unit}</p>) : <p>No goals saved.</p>}<h3>Recent workouts</h3>{workouts.data?.length ? workouts.data.map((workout, index) => <p key={index}>{workout.name} · {workout.status}</p>) : <p>No workouts saved.</p>}</section>
      <section className="fc-panel"><h2>Diet context</h2><p><strong>Preferences:</strong> {details.data.diet_preferences || "Not entered"}</p><p><strong>Notes:</strong> {details.data.diet_notes || "Not entered"}</p><h3>Recent meals</h3>{meals.data?.length ? meals.data.map((meal) => <p key={meal.id}>{meal.meal_type} · {new Date(meal.eaten_at).toLocaleDateString("en-AE")} · {meal.meal_items.map((food) => food.name).join(", ") || meal.notes || "No foods entered"}</p>) : <p>No meals saved.</p>}</section>
      <section className="fc-panel"><h2>Wellness context</h2><p>{details.data.wellness_notes || "No wellness notes entered."}</p><h3>Recent check-ins</h3>{checkins.data?.length ? checkins.data.map((entry) => <p key={entry.checked_on}>{entry.checked_on} · Energy {entry.energy}/5 · Mood {entry.mood}/5 · Sleep {entry.sleep_hours ?? "—"} h</p>) : <p>No check-ins saved.</p>}</section>
    </div>
    <p className="fc-local-note">Private journal entries are not shared. Client plans are guidance, separate from the trainee’s own workout and meal logs.</p>
  </div>;
}
