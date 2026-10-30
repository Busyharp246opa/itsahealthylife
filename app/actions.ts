"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { isOfflinePreview } from "../lib/supabase/availability";

export type ActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  href?: string;
};

async function authenticated() {
  const supabase = await createServerSupabaseClient();
  if (await isOfflinePreview()) return { supabase, user: null };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

function error(message: string): ActionResult {
  return { status: "error", message };
}

function success(message: string, href?: string): ActionResult {
  return { status: "success", message, href };
}

function dubaiDate() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Dubai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function createPost(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const body = String(formData.get("body") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const communityId = String(formData.get("communityId") ?? "").trim() || null;
  const requestedSpace = String(formData.get("circleSpace") ?? "trainee");
  if (body.length < 4) return error("Write at least four characters before publishing.");
  if (body.length > 5000) return error("Posts are limited to 5,000 characters.");
  if (title.length > 120) return error("Titles are limited to 120 characters.");
  if (requestedSpace !== "trainee" && requestedSpace !== "trainer") return error("Choose a valid Circle.");
  if (communityId && !/^[0-9a-f-]{36}$/i.test(communityId)) return error("Choose a valid community.");

  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const profile = await supabase.from("profiles").select("id,role,is_verified").eq("user_id", user.id).single();
  if (profile.error) return error("Your local profile is not ready yet.");
  const actualSpace = profile.data.is_verified && ["coachsphere", "fitsphere"].includes(profile.data.role) ? "trainer" : "trainee";
  if (requestedSpace !== actualSpace) return error("This account cannot post in that Circle.");
  if (requestedSpace === "trainer" && communityId) return error("Trainer Circle posts do not use trainee rooms.");
  const result = await supabase.from("posts").insert({
    author_user_id: user.id,
    author_profile_id: profile.data.id,
    community_id: communityId,
    title,
    body,
    audience: communityId ? "community" : "public",
    circle_space: requestedSpace,
  });
  if (result.error) return error(result.error.message);
  revalidatePath(requestedSpace === "trainer" ? "/trainer/circle" : "/circle");
  if (communityId) {
    const { data: community } = await supabase.from("communities").select("slug").eq("id", communityId).maybeSingle();
    if (community) revalidatePath(`/circle/communities/${community.slug}`);
  }
  return success("Published to your Circle.");
}

export async function copyWorkoutTemplate(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const templateId = String(formData.get("templateId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const template = await supabase.from("workouts").select("name, duration_minutes, notes, workout_exercises(exercise_id, position, target_sets, target_reps, rest_seconds, notes)").eq("id", templateId).eq("is_template", true).single();
  if (template.error) return error("That template is no longer available.");
  const workout = await supabase.from("workouts").insert({
    owner_id: user.id,
    name: `${template.data.name} · local copy`,
    status: "draft",
    duration_minutes: template.data.duration_minutes,
    notes: "Copied from a Healthy Life starter template.",
    is_template: false,
  }).select("id").single();
  if (workout.error) return error(workout.error.message);
  const exercises = template.data.workout_exercises.map((item) => ({
    workout_id: workout.data.id,
    exercise_id: item.exercise_id,
    position: item.position,
    target_sets: item.target_sets,
    target_reps: item.target_reps,
    rest_seconds: item.rest_seconds,
    notes: item.notes,
  }));
  if (exercises.length) {
    const copied = await supabase.from("workout_exercises").insert(exercises);
    if (copied.error) {
      await supabase.from("workouts").delete().eq("id", workout.data.id).eq("owner_id", user.id);
      return error(copied.error.message);
    }
  }
  revalidatePath("/train/workouts");
  return success("Workout copied to your drafts.", `/train/workouts/${workout.data.id}`);
}

export async function createWorkout(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 80) return error("Name the workout in 2 to 80 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("workouts").insert({ owner_id: user.id, name, status: "draft", is_template: false }).select("id").single();
  if (result.error) return error(result.error.message);
  revalidatePath("/train/workouts");
  return success("Private workout created. Add movements from the exercise catalog.", `/train/workouts/${result.data.id}`);
}

export async function addWorkoutExercise(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const workoutId = String(formData.get("workoutId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const workout = await supabase.from("workouts").select("id, status").eq("id", workoutId).eq("owner_id", user.id).eq("is_template", false).maybeSingle();
  if (!workout.data || workout.data.status !== "draft") return error("Open one of your draft workouts to add a movement.");
  const catalog = await supabase.from("exercise_catalog").select("id").eq("id", exerciseId).maybeSingle();
  if (!catalog.data) return error("Choose a movement from the catalog.");
  const existing = await supabase.from("workout_exercises").select("position").eq("workout_id", workoutId).order("position", { ascending: false }).limit(1);
  if (existing.error) return error(existing.error.message);
  const result = await supabase.from("workout_exercises").insert({ workout_id: workoutId, exercise_id: exerciseId, position: (existing.data?.[0]?.position ?? 0) + 1 });
  if (result.error) return error(result.error.message);
  revalidatePath(`/train/workouts/${workoutId}`);
  return success("Movement added to your draft.", `/train/workouts/${workoutId}`);
}

export async function updateWorkout(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const workoutId = String(formData.get("workoutId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (name.length < 2 || name.length > 80) return error("Name the workout in 2 to 80 characters.");
  if (notes.length > 1000) return error("Notes are limited to 1,000 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("workouts").update({ name, notes }).eq("id", workoutId).eq("owner_id", user.id).eq("status", "draft").select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Only your draft workouts can be edited.");
  revalidatePath(`/train/workouts/${workoutId}`);
  revalidatePath("/train/workouts");
  return success("Draft details saved.");
}

export async function changeWorkoutStatus(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const workoutId = String(formData.get("workoutId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const existing = await supabase.from("workouts").select("id, status, started_at").eq("id", workoutId).eq("owner_id", user.id).eq("is_template", false).maybeSingle();
  if (!existing.data) return error("This private workout is unavailable.");
  if (intent === "start") {
    const movements = await supabase.from("workout_exercises").select("id", { count: "exact", head: true }).eq("workout_id", workoutId);
    if (movements.error) return error(movements.error.message);
    if (!movements.count) return error("Add at least one movement before starting this workout.");
  }
  const now = new Date().toISOString();
  const update = intent === "start" && existing.data.status === "draft"
    ? { status: "active" as const, started_at: now }
    : intent === "complete" && existing.data.status === "active"
      ? { status: "completed" as const, completed_at: now, started_at: existing.data.started_at ?? now }
      : intent === "reopen" && existing.data.status === "completed"
        ? { status: "active" as const, completed_at: null }
        : null;
  if (!update) return error("That status change is unavailable for this workout.");
  const result = await supabase.from("workouts").update(update).eq("id", workoutId).eq("owner_id", user.id).eq("status", existing.data.status).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("The workout changed elsewhere. Refresh and try again.");
  revalidatePath(`/train/workouts/${workoutId}`);
  revalidatePath("/train/workouts");
  return success(intent === "start" ? "Workout started. Log each set as you go." : intent === "complete" ? "Workout completed and added to your history." : "Workout reopened for corrections.");
}

export async function saveWorkoutSet(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const workoutId = String(formData.get("workoutId") ?? "");
  const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "");
  const setNumber = Number(formData.get("setNumber"));
  const weightKg = Number(formData.get("weightKg"));
  const reps = Number(formData.get("reps"));
  const rpeInput = String(formData.get("rpe") ?? "").trim();
  const rpe = rpeInput ? Number(rpeInput) : null;
  if (!Number.isInteger(setNumber) || setNumber < 1 || setNumber > 20) return error("Set number must be between 1 and 20.");
  if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 999) return error("Weight must be between 0 and 999 kg.");
  if (!Number.isInteger(reps) || reps < 0 || reps > 100) return error("Repetitions must be between 0 and 100.");
  if (rpe !== null && (!Number.isFinite(rpe) || rpe < 0 || rpe > 10)) return error("Effort must be between 0 and 10.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const workout = await supabase.from("workouts").select("id").eq("id", workoutId).eq("owner_id", user.id).eq("status", "active").maybeSingle();
  if (!workout.data) return error("Start your own workout before logging sets.");
  const movement = await supabase.from("workout_exercises").select("id").eq("id", workoutExerciseId).eq("workout_id", workoutId).maybeSingle();
  if (!movement.data) return error("This movement is not in your workout.");
  const result = await supabase.from("workout_sets").upsert({
    workout_exercise_id: workoutExerciseId,
    owner_id: user.id,
    set_number: setNumber,
    weight_kg: weightKg,
    reps,
    rpe,
    is_warmup: String(formData.get("isWarmup") ?? "") === "on",
    completed_at: new Date().toISOString(),
  }, { onConflict: "workout_exercise_id,set_number" });
  if (result.error) return error(result.error.message);
  revalidatePath(`/train/workouts/${workoutId}`);
  return success(`Set ${setNumber} saved.`);
}

export async function removeWorkoutExercise(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const workoutId = String(formData.get("workoutId") ?? "");
  const workoutExerciseId = String(formData.get("workoutExerciseId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const workout = await supabase.from("workouts").select("id").eq("id", workoutId).eq("owner_id", user.id).eq("status", "draft").maybeSingle();
  if (!workout.data) return error("Only your draft workouts can be changed.");
  const result = await supabase.from("workout_exercises").delete().eq("id", workoutExerciseId).eq("workout_id", workoutId).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Movement was already removed.");
  revalidatePath(`/train/workouts/${workoutId}`);
  return success("Movement removed.");
}

export async function deleteWorkout(_: ActionResult, formData: FormData): Promise<ActionResult> {
  if (String(formData.get("confirmation") ?? "") !== "DELETE") return error("Type DELETE to remove this workout.");
  const workoutId = String(formData.get("workoutId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("workouts").delete().eq("id", workoutId).eq("owner_id", user.id).eq("is_template", false).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Private workout was not found.");
  revalidatePath("/train/workouts");
  revalidatePath("/insights");
  redirect("/train/workouts");
}

export async function saveCheckin(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mood = Number(formData.get("mood"));
  const energy = Number(formData.get("energy"));
  const soreness = Number(formData.get("soreness"));
  const sleepHours = Number(formData.get("sleepHours"));
  const note = String(formData.get("note") ?? "").trim();
  if ([mood, energy, soreness].some((value) => value < 1 || value > 5)) return error("Mood, energy, and soreness must be between 1 and 5.");
  if (sleepHours < 0 || sleepHours > 24) return error("Sleep must be between 0 and 24 hours.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("wellness_checkins").upsert({
    owner_id: user.id,
    mood,
    energy,
    soreness,
    sleep_hours: sleepHours,
    note,
    checked_on: dubaiDate(),
  }, { onConflict: "owner_id,checked_on" });
  if (result.error) return error(result.error.message);
  revalidatePath("/wellness");
  revalidatePath("/today");
  return success("Today’s check-in is saved privately.");
}

function mealItemFromForm(formData: FormData):
  | { ok: false; message: string }
  | { ok: true; item: { name: string; quantity: number; unit: string; calories: number; protein_g: number; carbs_g: number; fat_g: number } } {
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const unit = String(formData.get("unit") ?? "serving").trim();
  const calories = Number(formData.get("calories"));
  const proteinG = Number(formData.get("proteinG"));
  const carbsG = Number(formData.get("carbsG"));
  const fatG = Number(formData.get("fatG"));
  if (name.length < 2 || name.length > 120) return { ok: false, message: "Food name must be 2 to 120 characters." };
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) return { ok: false, message: "Enter a positive serving amount." };
  if (!unit || unit.length > 32) return { ok: false, message: "Enter a serving unit of at most 32 characters." };
  if (![calories, proteinG, carbsG, fatG].every((value) => Number.isFinite(value) && value >= 0 && value <= 10000)) return { ok: false, message: "Calories and macros must be non-negative numbers." };
  return { ok: true, item: { name, quantity, unit, calories: Math.round(calories), protein_g: proteinG, carbs_g: carbsG, fat_g: fatG } };
}

export async function createMeal(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mealType = String(formData.get("mealType") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!["breakfast", "lunch", "dinner", "snack"].includes(mealType)) return error("Choose a meal type.");
  if (notes.length > 500) return error("Meal notes are limited to 500 characters.");
  const parsed = mealItemFromForm(formData);
  if (!parsed.ok) return error(parsed.message);
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const meal = await supabase.from("meals").insert({ owner_id: user.id, meal_type: mealType, notes }).select("id").single();
  if (meal.error) return error(meal.error.message);
  const item = await supabase.from("meal_items").insert({ meal_id: meal.data.id, ...parsed.item });
  if (item.error) {
    await supabase.from("meals").delete().eq("id", meal.data.id).eq("owner_id", user.id);
    return error(item.error.message);
  }
  revalidatePath("/wellness");
  return success("Meal logged privately. Add more foods from its detail page.", `/wellness/meals/${meal.data.id}`);
}

export async function addMealItem(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mealId = String(formData.get("mealId") ?? "");
  const parsed = mealItemFromForm(formData);
  if (!parsed.ok) return error(parsed.message);
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const meal = await supabase.from("meals").select("id").eq("id", mealId).eq("owner_id", user.id).maybeSingle();
  if (!meal.data) return error("That private meal is unavailable.");
  const result = await supabase.from("meal_items").insert({ meal_id: mealId, ...parsed.item });
  if (result.error) return error(result.error.message);
  revalidatePath(`/wellness/meals/${mealId}`);
  revalidatePath("/wellness");
  return success("Food added to the meal.");
}

export async function removeMealItem(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mealId = String(formData.get("mealId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const meal = await supabase.from("meals").select("id").eq("id", mealId).eq("owner_id", user.id).maybeSingle();
  if (!meal.data) return error("That private meal is unavailable.");
  const result = await supabase.from("meal_items").delete().eq("id", itemId).eq("meal_id", mealId).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Food was already removed.");
  revalidatePath(`/wellness/meals/${mealId}`);
  revalidatePath("/wellness");
  return success("Food removed.");
}

export async function updateMealItem(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mealId = String(formData.get("mealId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const parsed = mealItemFromForm(formData);
  if (!parsed.ok) return error(parsed.message);
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const meal = await supabase.from("meals").select("id").eq("id", mealId).eq("owner_id", user.id).maybeSingle();
  if (!meal.data) return error("That private meal is unavailable.");
  const result = await supabase.from("meal_items").update(parsed.item).eq("id", itemId).eq("meal_id", mealId).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Food was not found.");
  revalidatePath(`/wellness/meals/${mealId}`);
  revalidatePath("/wellness");
  revalidatePath("/insights");
  return success("Food values updated.");
}

export async function updateMeal(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const mealId = String(formData.get("mealId") ?? "");
  const mealType = String(formData.get("mealType") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!["breakfast", "lunch", "dinner", "snack"].includes(mealType)) return error("Choose a meal type.");
  if (notes.length > 500) return error("Meal notes are limited to 500 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("meals").update({ meal_type: mealType, notes }).eq("id", mealId).eq("owner_id", user.id).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Private meal was not found.");
  revalidatePath(`/wellness/meals/${mealId}`);
  revalidatePath("/wellness");
  return success("Meal details updated.");
}

export async function deleteMeal(_: ActionResult, formData: FormData): Promise<ActionResult> {
  if (String(formData.get("confirmation") ?? "") !== "DELETE") return error("Type DELETE to remove this meal.");
  const mealId = String(formData.get("mealId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("meals").delete().eq("id", mealId).eq("owner_id", user.id).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Private meal was not found.");
  revalidatePath("/wellness");
  revalidatePath("/insights");
  redirect("/wellness");
}

export async function createJournalEntry(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length > 120) return error("Journal title is limited to 120 characters.");
  if (body.length < 2 || body.length > 5000) return error("Write between 2 and 5,000 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("journal_entries").insert({ owner_id: user.id, title, body });
  if (result.error) return error(result.error.message);
  revalidatePath("/wellness");
  return success("Private reflection saved.");
}

export async function updateJournalEntry(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const entryId = String(formData.get("entryId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (title.length > 120 || body.length < 2 || body.length > 5000) return error("Check the title and write 2 to 5,000 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("journal_entries").update({ title, body }).eq("id", entryId).eq("owner_id", user.id).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Private reflection was not found.");
  revalidatePath("/wellness");
  return success("Reflection updated.");
}

export async function deleteJournalEntry(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const entryId = String(formData.get("entryId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("journal_entries").delete().eq("id", entryId).eq("owner_id", user.id).select("id").maybeSingle();
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Private reflection was not found.");
  revalidatePath("/wellness");
  return success("Reflection removed.");
}

export async function loadDemoHistory(_previous: ActionResult): Promise<ActionResult> {
  void _previous;
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.rpc("load_member_demo_history");
  if (result.error) return error(result.error.message);
  revalidatePath("/wellness");
  revalidatePath("/train/workouts");
  revalidatePath("/insights");
  return success(result.data ? "Synthetic sample history loaded into this local account." : "Sample history was already loaded for this account.");
}

export async function requestBooking(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const coachId = String(formData.get("coachId") ?? "");
  const slotId = String(formData.get("slotId") ?? "");
  const packageId = String(formData.get("packageId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim();
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const slot = await supabase.from("coach_availability").select("starts_at, is_booked").eq("id", slotId).eq("coach_id", coachId).single();
  if (slot.error || slot.data.is_booked) return error("That slot is no longer available.");
  const result = await supabase.from("bookings").insert({
    member_id: user.id,
    coach_id: coachId,
    package_id: packageId,
    slot_id: slotId,
    starts_at: slot.data.starts_at,
    note,
  });
  if (result.error) return error(result.error.message);
  revalidatePath(`/coaches/${coachId}`);
  return success("Session request saved to local Supabase. No payment was taken.");
}

export async function joinChallenge(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const challengeId = String(formData.get("challengeId") ?? "");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("challenge_participants").upsert({ challenge_id: challengeId, user_id: user.id }, { onConflict: "challenge_id,user_id" });
  if (result.error) return error(result.error.message);
  revalidatePath("/challenges");
  return success("Challenge added to your local plan.");
}

export async function sendMessage(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return error("Write a message first.");
  if (body.length > 4000) return error("Messages are limited to 4,000 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const profile = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
  if (profile.error) return error("Your local profile is not ready yet.");
  const result = await supabase.from("messages").insert({ conversation_id: conversationId, sender_user_id: user.id, sender_profile_id: profile.data.id, body });
  if (result.error) return error(result.error.message);
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath(`/trainer/messages/${conversationId}`);
  return success("Sent locally.");
}

export async function updateConsent(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const scope = String(formData.get("scope") ?? "") as "wellness_personalization" | "coach_readiness" | "marketing" | "research";
  if (!["wellness_personalization", "coach_readiness", "marketing", "research"].includes(scope)) return error("Choose a valid consent purpose.");
  const granted = String(formData.get("granted") ?? "false") === "true";
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("consent_grants").upsert({ owner_id: user.id, scope, granted, updated_at: new Date().toISOString() }, { onConflict: "owner_id,scope" });
  if (result.error) return error(result.error.message);
  revalidatePath("/settings");
  return success(granted ? "Consent granted." : "Consent revoked for future processing.");
}

export async function updateProfile(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const headline = String(formData.get("headline") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const isPublic = String(formData.get("isPublic") ?? "") === "on";
  if (displayName.length < 2 || displayName.length > 80) return error("Display name must be 2 to 80 characters.");
  if (!/^[a-z0-9_]{3,32}$/.test(handle)) return error("Handle must be 3 to 32 lowercase letters, numbers, or underscores.");
  if (headline.length > 160 || location.length > 120 || bio.length > 1000) return error("Profile text is too long.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const initials = displayName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const result = await supabase.from("profiles").update({ display_name: displayName, handle, headline, location, bio, initials, is_public: isPublic }).eq("user_id", user.id).select("id").maybeSingle();
  if (result.error) return error(result.error.code === "23505" ? "That handle is already taken." : result.error.message);
  if (!result.data) return error("Your profile is not ready yet.");
  revalidatePath("/settings");
  return success("Profile saved.");
}

export async function updateNotificationPreferences(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("notification_preferences").upsert({
    owner_id: user.id,
    reminder_day: formData.has("reminderDay"),
    reminder_hour: formData.has("reminderHour"),
    reminder_ten_minutes: formData.has("reminderTenMinutes"),
    weekly_digest: formData.has("weeklyDigest"),
  }, { onConflict: "owner_id" });
  if (result.error) return error(result.error.message);
  revalidatePath("/settings");
  return success("Reminder preferences saved locally. No notification provider is connected.");
}

export async function createDataRequest(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const requestType = String(formData.get("requestType") ?? "") as "export" | "delete" | "correct";
  if (!["export", "delete", "correct"].includes(requestType)) return error("Choose a valid request type.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.from("data_requests").insert({ owner_id: user.id, request_type: requestType });
  if (result.error) return error(result.error.message);
  revalidatePath("/settings");
  return success(`${requestType[0].toUpperCase()}${requestType.slice(1)} request queued locally.`);
}

export async function deleteMyAccount(_: ActionResult, formData: FormData): Promise<ActionResult> {
  if (String(formData.get("confirmation") ?? "") !== "DELETE") return error("Type DELETE exactly to remove this account.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Your local session is still starting. Try again in a moment.");
  const result = await supabase.rpc("delete_my_account", { confirmation: "DELETE" });
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Account could not be deleted.");
  await supabase.auth.signOut();
  return success("Account and private data deleted. A new local identity will start when you reload.");
}

export async function operatorUpdateCase(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const targetId = String(formData.get("targetId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "") as "open" | "review" | "resolved" | "dismissed";
  const note = String(formData.get("note") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(targetId) || !["open", "review", "resolved", "dismissed"].includes(nextStatus)) return error("Choose a valid case and status.");
  if (note.length < 3 || note.length > 1000) return error("Write a review note of 3 to 1,000 characters.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Sign in with an operator account first.");
  const result = await supabase.rpc("operator_update_case", { target_id: targetId, next_status: nextStatus, note });
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Case was not found.");
  revalidatePath("/admin", "layout");
  return success("Case updated and audit event recorded.");
}

export async function operatorSetFeatureFlag(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const flagKey = String(formData.get("flagKey") ?? "");
  const nextEnabled = String(formData.get("nextEnabled") ?? "") === "true";
  if (!/^[a-z0-9_]{3,80}$/.test(flagKey)) return error("Choose a valid feature flag.");
  const { supabase, user } = await authenticated();
  if (!user) return error("Sign in with an operator account first.");
  const result = await supabase.rpc("operator_set_feature_flag", { flag_key: flagKey, next_enabled: nextEnabled });
  if (result.error) return error(result.error.message);
  if (!result.data) return error("Flag was not found.");
  revalidatePath("/admin", "layout");
  return success("Feature flag updated and audit event recorded.");
}
