"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string, href?: string): ActionResult => ({ status: "success", message, href });
const uuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const dateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

async function trainee() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "member") return null;
  return { db, user };
}

function refreshProgram(id?: string) {
  revalidatePath("/train");
  revalidatePath("/train/my-programs");
  revalidatePath("/calendar");
  revalidatePath("/calendar/schedules");
  if (id) revalidatePath(`/train/my-programs/${id}`);
}

async function ownedDay(context: NonNullable<Awaited<ReturnType<typeof trainee>>>, programId: string, dayId: string) {
  if (!uuid(programId) || !uuid(dayId)) return null;
  const { data } = await context.db.from("trainee_program_days")
    .select("id,weekday").eq("id", dayId).eq("program_id", programId).eq("owner_id", context.user.id).maybeSingle();
  return data;
}

async function nextPosition(context: NonNullable<Awaited<ReturnType<typeof trainee>>>, dayId: string) {
  const { data, error } = await context.db.from("trainee_program_movements")
    .select("position").eq("day_id", dayId).eq("owner_id", context.user.id).order("position", { ascending: false }).limit(1);
  if (error) throw new Error(error.message);
  return (data?.[0]?.position ?? 0) + 1;
}

export async function createWeeklyProgram(_: ActionResult, form: FormData): Promise<ActionResult> {
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (title.length < 2 || title.length > 80 || description.length > 500) return fail("Use a 2–80 character name and a description under 500 characters.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to build a weekly program.");
  const { data, error } = await context.db.from("trainee_programs").insert({ owner_id: context.user.id, title, description }).select("id").single();
  if (error) return fail(error.message);
  refreshProgram(data.id);
  return ok("Seven-day program created. Add exercises to the days you train.", `/train/my-programs/${data.id}`);
}

export async function copyStarterProgram(_: ActionResult, form: FormData): Promise<ActionResult> {
  const sourceId = String(form.get("sourceId") ?? "");
  if (!uuid(sourceId)) return fail("Choose a starter program.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to follow a starter program.");
  const { data: source, error } = await context.db.from("programs")
    .select("id,title,summary,program_sessions(id,week_number,day_number,title,program_session_exercises(exercise_id,position,target_sets,target_reps))")
    .eq("id", sourceId).eq("status", "published").maybeSingle();
  if (error || !source) return fail("This starter program is unavailable.");
  const created = await context.db.from("trainee_programs").insert({ owner_id: context.user.id, title: source.title, description: source.summary }).select("id").single();
  if (created.error) return fail(created.error.message);
  const programId = created.data.id;
  const days = await context.db.from("trainee_program_days").select("id,weekday").eq("program_id", programId).eq("owner_id", context.user.id);
  if (days.error || !days.data) return fail("The program was created, but its days could not be loaded. Open it to finish setup.");
  const sourceSessions = source.program_sessions.filter((item) => item.week_number === 1).sort((a, b) => a.day_number - b.day_number).slice(0, 7);
  for (const [index, session] of sourceSessions.entries()) {
    const day = days.data.find((item) => item.weekday === index + 1);
    if (!day) continue;
    const renamed = await context.db.from("trainee_program_days").update({ label: session.title }).eq("id", day.id).eq("owner_id", context.user.id);
    if (renamed.error) return fail("Program copied. Open it to finish the day labels.");
    const movements = session.program_session_exercises.map((item) => ({ owner_id: context.user.id, day_id: day.id, catalog_exercise_id: item.exercise_id, position: item.position, target_sets: item.target_sets, target_reps: item.target_reps }));
    if (movements.length) {
      const inserted = await context.db.from("trainee_program_movements").insert(movements);
      if (inserted.error) return fail("Program copied. Open it to finish adding exercises.");
    }
  }
  refreshProgram(programId);
  return ok("Starter week copied into your editable program.", `/train/my-programs/${programId}`);
}

export async function saveWeeklyProgram(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("programId") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  if (!uuid(id) || title.length < 2 || title.length > 80 || description.length > 500) return fail("Check the program name and description.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to edit your program.");
  const { data, error } = await context.db.from("trainee_programs").update({ title, description, updated_at: new Date().toISOString() }).eq("id", id).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (error || !data) return fail(error?.message ?? "Program not found.");
  refreshProgram(id);
  return ok("Program details saved.");
}

export async function deleteWeeklyProgram(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("programId") ?? "");
  if (!uuid(id) || String(form.get("confirmation") ?? "") !== "DELETE") return fail("Type DELETE to remove this program.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to remove your program.");
  const { count, error: scheduleError } = await context.db.from("trainee_schedules")
    .select("id", { count: "exact", head: true }).eq("program_id", id).eq("owner_id", context.user.id);
  if (scheduleError) return fail(scheduleError.message);
  if (count) return fail("Remove schedules that use this program first.");
  const { data, error } = await context.db.from("trainee_programs").delete().eq("id", id).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (error || !data) return fail(error?.message ?? "Program not found.");
  refreshProgram();
  return ok("Program removed.", "/train/my-programs");
}

export async function saveProgramDay(_: ActionResult, form: FormData): Promise<ActionResult> {
  const programId = String(form.get("programId") ?? "");
  const dayId = String(form.get("dayId") ?? "");
  const label = String(form.get("label") ?? "").trim();
  if (label.length < 2 || label.length > 60) return fail("Use a day name between 2 and 60 characters.");
  const context = await trainee();
  if (!context || !await ownedDay(context, programId, dayId)) return fail("This program day is unavailable.");
  const { error } = await context.db.from("trainee_program_days").update({ label }).eq("id", dayId).eq("owner_id", context.user.id);
  if (error) return fail(error.message);
  refreshProgram(programId);
  return ok("Day saved.");
}

export async function addCatalogMovement(_: ActionResult, form: FormData): Promise<ActionResult> {
  const programId = String(form.get("programId") ?? "");
  const dayId = String(form.get("dayId") ?? "");
  const exerciseId = String(form.get("exerciseId") ?? "");
  const context = await trainee();
  if (!context || !await ownedDay(context, programId, dayId)) return fail("This program day is unavailable.");
  const { data: exercise } = await context.db.from("exercise_catalog").select("id").eq("id", exerciseId).eq("is_active", true).maybeSingle();
  if (!exercise) return fail("Choose an available catalog exercise.");
  const position = await nextPosition(context, dayId);
  if (position > 40) return fail("A day can have up to 40 exercises.");
  const { error } = await context.db.from("trainee_program_movements").insert({ owner_id: context.user.id, day_id: dayId, catalog_exercise_id: exerciseId, position });
  if (error) return fail(error.message);
  refreshProgram(programId);
  return ok("Exercise added to this day.");
}

export async function addCustomMovement(_: ActionResult, form: FormData): Promise<ActionResult> {
  const programId = String(form.get("programId") ?? "");
  const dayId = String(form.get("dayId") ?? "");
  const existingId = String(form.get("existingId") ?? "");
  const name = String(form.get("name") ?? "").trim();
  const target = String(form.get("target") ?? "").trim();
  const equipment = String(form.get("equipment") ?? "").trim();
  const instructions = String(form.get("instructions") ?? "").trim();
  const context = await trainee();
  if (!context || !await ownedDay(context, programId, dayId)) return fail("This program day is unavailable.");
  let customId = existingId;
  if (existingId) {
    if (!uuid(existingId)) return fail("Choose one of your custom exercises.");
    const { data } = await context.db.from("trainee_exercises").select("id").eq("id", existingId).eq("owner_id", context.user.id).maybeSingle();
    if (!data) return fail("This custom exercise is unavailable.");
  } else {
    if (name.length < 2 || name.length > 100 || target.length > 80 || equipment.length > 80 || instructions.length > 1000) return fail("Name the exercise and keep its details within the field limits.");
    const created = await context.db.from("trainee_exercises").insert({ owner_id: context.user.id, name, target, equipment, instructions }).select("id").single();
    if (created.error) return fail(created.error.message);
    customId = created.data.id;
  }
  const position = await nextPosition(context, dayId);
  if (position > 40) return fail("A day can have up to 40 exercises.");
  const { error } = await context.db.from("trainee_program_movements").insert({ owner_id: context.user.id, day_id: dayId, custom_exercise_id: customId, position });
  if (error) return fail(error.message);
  refreshProgram(programId);
  return ok("Your exercise was added to this day.");
}

export async function saveProgramMovement(_: ActionResult, form: FormData): Promise<ActionResult> {
  const programId = String(form.get("programId") ?? "");
  const dayId = String(form.get("dayId") ?? "");
  const movementId = String(form.get("movementId") ?? "");
  const sets = Number(form.get("sets"));
  const reps = String(form.get("reps") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  if (!Number.isInteger(sets) || sets < 1 || sets > 12 || !reps || reps.length > 30 || notes.length > 500) return fail("Use 1–12 sets, a short rep target, and notes under 500 characters.");
  const context = await trainee();
  if (!context || !await ownedDay(context, programId, dayId) || !uuid(movementId)) return fail("This program exercise is unavailable.");
  const { data, error } = await context.db.from("trainee_program_movements").update({ target_sets: sets, target_reps: reps, notes }).eq("id", movementId).eq("day_id", dayId).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (error || !data) return fail(error?.message ?? "Exercise not found.");
  refreshProgram(programId);
  return ok("Exercise targets saved.");
}

export async function removeProgramMovement(_: ActionResult, form: FormData): Promise<ActionResult> {
  const programId = String(form.get("programId") ?? "");
  const dayId = String(form.get("dayId") ?? "");
  const movementId = String(form.get("movementId") ?? "");
  const context = await trainee();
  if (!context || !await ownedDay(context, programId, dayId) || !uuid(movementId)) return fail("This program exercise is unavailable.");
  const { error } = await context.db.from("trainee_program_movements").delete().eq("id", movementId).eq("day_id", dayId).eq("owner_id", context.user.id);
  if (error) return fail(error.message);
  refreshProgram(programId);
  return ok("Exercise removed from this day.");
}

export async function createTrainingSchedule(_: ActionResult, form: FormData): Promise<ActionResult> {
  const title = String(form.get("title") ?? "").trim();
  const programId = String(form.get("programId") ?? "");
  const startsOn = String(form.get("startsOn") ?? "");
  if (title.length < 2 || title.length > 80 || !uuid(programId) || !dateOnly(startsOn)) return fail("Choose a program, schedule name and valid start date.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to set your schedule.");
  const { data: program } = await context.db.from("trainee_programs").select("id").eq("id", programId).eq("owner_id", context.user.id).maybeSingle();
  if (!program) return fail("Choose one of your programs.");
  const old = await context.db.from("trainee_schedules").select("id").eq("owner_id", context.user.id).eq("is_active", true).maybeSingle();
  if (old.error) return fail(old.error.message);
  const inserted = await context.db.from("trainee_schedules").insert({ owner_id: context.user.id, title, program_id: programId, starts_on: startsOn, is_active: false }).select("id").single();
  if (inserted.error) return fail(inserted.error.message);
  if (old.data) await context.db.from("trainee_schedules").update({ is_active: false }).eq("id", old.data.id).eq("owner_id", context.user.id);
  const activated = await context.db.from("trainee_schedules").update({ is_active: true }).eq("id", inserted.data.id).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (activated.error || !activated.data) {
    if (old.data) await context.db.from("trainee_schedules").update({ is_active: true }).eq("id", old.data.id).eq("owner_id", context.user.id);
    await context.db.from("trainee_schedules").delete().eq("id", inserted.data.id).eq("owner_id", context.user.id);
    return fail(activated.error?.message ?? "Could not activate this schedule.");
  }
  refreshProgram(programId);
  return ok("Schedule created and selected for your week.", "/calendar");
}

export async function selectTrainingSchedule(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("scheduleId") ?? "");
  if (!uuid(id)) return fail("Choose a saved schedule.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to select a schedule.");
  const { data: selected } = await context.db.from("trainee_schedules").select("id").eq("id", id).eq("owner_id", context.user.id).maybeSingle();
  if (!selected) return fail("This schedule is unavailable.");
  const { data: old } = await context.db.from("trainee_schedules").select("id").eq("owner_id", context.user.id).eq("is_active", true).maybeSingle();
  if (old?.id === id) return ok("Already following this schedule.");
  if (old) await context.db.from("trainee_schedules").update({ is_active: false }).eq("id", old.id).eq("owner_id", context.user.id);
  const changed = await context.db.from("trainee_schedules").update({ is_active: true }).eq("id", id).eq("owner_id", context.user.id).select("id").maybeSingle();
  if (changed.error || !changed.data) {
    if (old) await context.db.from("trainee_schedules").update({ is_active: true }).eq("id", old.id).eq("owner_id", context.user.id);
    return fail(changed.error?.message ?? "Could not switch schedules.");
  }
  refreshProgram();
  return ok("Now following this schedule.");
}

export async function toggleScheduleShare(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("scheduleId") ?? "");
  if (!uuid(id)) return fail("Choose a saved schedule.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to share a schedule.");
  const { data: current } = await context.db.from("trainee_schedules").select("share_token").eq("id", id).eq("owner_id", context.user.id).maybeSingle();
  if (!current) return fail("This schedule is unavailable.");
  const token = current.share_token ? null : crypto.randomUUID();
  const { error } = await context.db.from("trainee_schedules").update({ share_token: token }).eq("id", id).eq("owner_id", context.user.id);
  if (error) return fail(error.message);
  refreshProgram();
  return ok(token ? "Read-only share link enabled." : "Share link revoked.");
}

export async function deleteTrainingSchedule(_: ActionResult, form: FormData): Promise<ActionResult> {
  const id = String(form.get("scheduleId") ?? "");
  if (!uuid(id) || String(form.get("confirmation") ?? "") !== "DELETE") return fail("Type DELETE to remove this schedule.");
  const context = await trainee();
  if (!context) return fail("Sign in as a trainee to remove a schedule.");
  const { error } = await context.db.from("trainee_schedules").delete().eq("id", id).eq("owner_id", context.user.id);
  if (error) return fail(error.message);
  refreshProgram();
  return ok("Schedule removed. Its share link no longer works.");
}
