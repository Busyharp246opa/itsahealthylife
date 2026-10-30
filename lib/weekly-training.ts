import "server-only";
import { createAdminSupabaseClient } from "./supabase/admin";
import { isOfflinePreview } from "./supabase/availability";
import { createServerSupabaseClient } from "./supabase/server";

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type WeeklyMovement = {
  id: string;
  position: number;
  target_sets: number;
  target_reps: string;
  notes: string;
  catalog_exercise_id: string | null;
  custom_exercise_id: string | null;
  exercise_catalog: { id: string; name: string; target: string; equipment: string } | null;
  trainee_exercises: { id: string; name: string; target: string; equipment: string; instructions: string } | null;
};
export type WeeklyDay = { id: string; weekday: number; label: string; trainee_program_movements: WeeklyMovement[] };
export type WeeklyProgram = { id: string; title: string; description: string; created_at: string; trainee_program_days: WeeklyDay[] };
export type WeeklySchedule = { id: string; title: string; program_id: string; starts_on: string; is_active: boolean; share_token: string | null; created_at: string };
export type CustomExercise = { id: string; name: string; target: string; equipment: string; instructions: string };

const programSelect = "id,title,description,created_at,trainee_program_days(id,weekday,label,trainee_program_movements(id,position,target_sets,target_reps,notes,catalog_exercise_id,custom_exercise_id,exercise_catalog(id,name,target,equipment),trainee_exercises(id,name,target,equipment,instructions)))";

function orderedProgram(program: WeeklyProgram): WeeklyProgram {
  return { ...program, trainee_program_days: program.trainee_program_days
    .map((day) => ({ ...day, trainee_program_movements: [...day.trainee_program_movements].sort((a, b) => a.position - b.position) }))
    .sort((a, b) => a.weekday - b.weekday) };
}

export async function getMyWeeklyTraining() {
  if (await isOfflinePreview()) return { programs: [] as WeeklyProgram[], schedules: [] as WeeklySchedule[], exercises: [] as CustomExercise[] };
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { programs: [] as WeeklyProgram[], schedules: [] as WeeklySchedule[], exercises: [] as CustomExercise[] };
  const [programs, schedules, exercises] = await Promise.all([
    db.from("trainee_programs").select(programSelect).eq("owner_id", user.id).order("created_at", { ascending: false }),
    db.from("trainee_schedules").select("id,title,program_id,starts_on,is_active,share_token,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
    db.from("trainee_exercises").select("id,name,target,equipment,instructions").eq("owner_id", user.id).order("name"),
  ]);
  if (programs.error || schedules.error || exercises.error) throw new Error(programs.error?.message ?? schedules.error?.message ?? exercises.error?.message);
  return { programs: (programs.data as WeeklyProgram[]).map(orderedProgram), schedules: schedules.data as WeeklySchedule[], exercises: exercises.data as CustomExercise[] };
}

export async function getMyWeeklyProgram(id: string) {
  const data = await getMyWeeklyTraining();
  return { program: data.programs.find((item) => item.id === id) ?? null, exercises: data.exercises, schedules: data.schedules };
}

export async function getSharedWeeklySchedule(token: string) {
  if (!/^[0-9a-f-]{36}$/i.test(token) || await isOfflinePreview()) return null;
  const db = createAdminSupabaseClient();
  const { data: schedule, error } = await db.from("trainee_schedules")
    .select("id,title,program_id,starts_on,owner_id").eq("share_token", token).maybeSingle();
  if (error || !schedule) return null;
  const { data: program, error: programError } = await db.from("trainee_programs")
    .select(programSelect).eq("id", schedule.program_id).eq("owner_id", schedule.owner_id).maybeSingle();
  if (programError || !program) return null;
  return { schedule: { title: schedule.title, starts_on: schedule.starts_on }, program: orderedProgram(program as WeeklyProgram) };
}

export function dubaiToday() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function weekDates(today = dubaiToday()) {
  const date = new Date(`${today}T12:00:00Z`);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return WEEKDAYS.map((_, index) => {
    const day = new Date(date);
    day.setUTCDate(date.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function selectedWeek(value?: string) {
  const today = dubaiToday();
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return weekDates(today)[0];
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return weekDates(today)[0];
  return weekDates(value)[0];
}

export function shiftWeek(monday: string, weeks: number) {
  const date = new Date(`${monday}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
}
