import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Challenge, Coach, Community, Conversation, Exercise, Operation, Post, Product, Profile, Program, Workout } from "./fitcircle-data";

type SourceExercise = {
  id: string; name: string; category: string; bodyPart: string; equipment: string; target: string;
  muscleGroup: string; secondaryMuscles: string[]; instructions: Record<string, string>;
  steps: Record<string, string[]>; mediaId: string; imagePath: string; gifPath: string;
  mediaAttribution: string; sourceCreatedAt: string;
};

let catalog: Exercise[] | undefined;
export function previewExercises(): Exercise[] {
  if (!catalog) {
    const source = JSON.parse(readFileSync(join(process.cwd(), "public/data/exercises.json"), "utf8")) as SourceExercise[];
    catalog = source.map((item) => ({
      id: item.id, name: item.name, category: item.category, body_part: item.bodyPart,
      equipment: item.equipment, target: item.target, muscle_group: item.muscleGroup,
      secondary_muscles: item.secondaryMuscles, instructions: item.instructions.en ?? "",
      steps: item.steps.en ?? [], instructions_by_locale: item.instructions,
      instruction_steps_by_locale: item.steps, media_id: item.mediaId, image_path: item.imagePath,
      gif_path: item.gifPath, media_attribution: item.mediaAttribution,
      media_license_status: "restricted", source_created_at: item.sourceCreatedAt,
      source_url: "https://github.com/hasaneyldrm/exercises-dataset", source_license: "MIT",
    }));
  }
  return catalog;
}

export function previewFacets() {
  const exercises = previewExercises();
  const count = (key: "category" | "equipment" | "target") => {
    const totals = new Map<string, number>();
    for (const exercise of exercises) totals.set(exercise[key], (totals.get(exercise[key]) ?? 0) + 1);
    return [...totals].map(([name, total]) => ({ name, count: total })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  };
  return { categories: count("category"), equipment: count("equipment"), targets: count("target") };
}

const id = (group: string, number: number) => `${group.padEnd(8, "0")}-0000-4000-8000-${String(number).padStart(12, "0")}`;
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const at = (offset: number, hour = 14) => `${day(offset)}T${String(hour).padStart(2, "0")}:30:00.000Z`;

export const previewPeople: Profile[] = [
  { id: id("1", 1), handle: "maya_moves", display_name: "Maya Nasser", initials: "MN", role: "fitsphere", headline: "Strength coach · movement quality", location: "Dubai, UAE", bio: "Coach-led strength and mobility for busy training weeks.", avatar_tone: "coach", is_verified: true },
  { id: id("1", 2), handle: "omar_builds", display_name: "Omar Khalid", initials: "OK", role: "coachsphere", headline: "Performance coach · barbell fundamentals", location: "Abu Dhabi, UAE", bio: "Simple programming, clear feedback, and repeatable progress.", avatar_tone: "reward", is_verified: true },
  { id: id("1", 3), handle: "lena_recovers", display_name: "Lena Torres", initials: "LT", role: "fitsphere", headline: "Mobility coach · recovery sessions", location: "Dubai, UAE", bio: "Low-friction mobility plans for strength athletes.", avatar_tone: "calm", is_verified: true },
  { id: id("1", 4), handle: "noor_runs", display_name: "Noor Rahman", initials: "NR", role: "member", headline: "Hybrid training · run and lift", location: "Sharjah, UAE", bio: "Training for the next five kilometres without giving up the barbell.", avatar_tone: "member", is_verified: false },
  { id: id("1", 5), handle: "kai_consistent", display_name: "Kai Santos", initials: "KS", role: "member", headline: "Three sessions every week", location: "Dubai, UAE", bio: "Small wins, logged honestly.", avatar_tone: "member", is_verified: false },
];

export const previewPrograms: Program[] = [
  { id: id("4", 1), title: "Foundation strength", slug: "foundation-strength", summary: "Three deliberate full-body sessions with repeatable progressions.", level: "Intermediate", weeks: 6, sessions_per_week: 3, accent: "cyan", profiles: previewPeople[0], program_sessions: [
    { id: id("41", 1), week_number: 1, day_number: 1, title: "Upper strength", duration_minutes: 52, focus: "Bench · row · shoulder" },
    { id: id("41", 2), week_number: 1, day_number: 2, title: "Lower strength", duration_minutes: 58, focus: "Squat · hinge · lunge" },
    { id: id("41", 3), week_number: 1, day_number: 3, title: "Full-body volume", duration_minutes: 48, focus: "Technique · repeatable effort" },
  ] },
  { id: id("4", 2), title: "Daily range", slug: "daily-range", summary: "Short mobility sessions that fit before or after training.", level: "All levels", weeks: 4, sessions_per_week: 5, accent: "green", profiles: previewPeople[2], program_sessions: [
    { id: id("41", 4), week_number: 1, day_number: 1, title: "Hips and ankles", duration_minutes: 14, focus: "Range before load" },
  ] },
  { id: id("4", 3), title: "Barbell base", slug: "barbell-base", summary: "Practice the squat, bench, deadlift, and row with controlled volume.", level: "Beginner", weeks: 8, sessions_per_week: 3, accent: "orange", profiles: previewPeople[1], program_sessions: [
    { id: id("41", 5), week_number: 1, day_number: 1, title: "Barbell A", duration_minutes: 62, focus: "Squat · bench · row" },
  ] },
];

function movement(number: number, exerciseId: string, position: number, sets: number, reps: string): Workout["workout_exercises"][number] {
  const exercise = previewExercises().find((item) => item.id === exerciseId);
  return { id: id("51", number), position, target_sets: sets, target_reps: reps, rest_seconds: 90, workout_sets: [],
    exercise_catalog: exercise ? { id: exercise.id, name: exercise.name, body_part: exercise.body_part, target: exercise.target, equipment: exercise.equipment } : null };
}

export function previewWorkouts(): Workout[] {
  return [
    { id: id("5", 1), owner_id: null, name: "Upper strength", status: "scheduled", scheduled_for: at(1), started_at: null, completed_at: null, duration_minutes: 52, notes: "Synthetic starter template", is_template: true, workout_exercises: [movement(1, "0025", 1, 4, "6"), movement(2, "0027", 2, 4, "8"), movement(3, "0405", 3, 3, "10")] },
    { id: id("5", 2), owner_id: null, name: "Lower strength", status: "scheduled", scheduled_for: at(3, 6), started_at: null, completed_at: null, duration_minutes: 58, notes: "Synthetic starter template", is_template: true, workout_exercises: [movement(4, "0043", 1, 4, "6"), movement(5, "0032", 2, 3, "5")] },
    { id: id("5", 3), owner_id: null, name: "Recovery circuit", status: "scheduled", scheduled_for: at(2, 5), started_at: null, completed_at: null, duration_minutes: 24, notes: "Synthetic starter template", is_template: true, workout_exercises: [movement(6, "0464", 1, 3, "30 sec"), movement(7, "1460", 2, 2, "8 / side")] },
  ];
}

export const previewCommunities: Community[] = [
  { id: id("6", 1), slug: "strength-room", name: "Strength room", description: "Programming notes, technique checks, and honest training logs.", topic: "Strength", member_count: 2840, post_count: 912, accent: "cyan" },
  { id: id("6", 2), slug: "move-every-day", name: "Move every day", description: "Short sessions, mobility streaks, and lower-friction plans.", topic: "Consistency", member_count: 3910, post_count: 1384, accent: "green" },
  { id: id("6", 3), slug: "dubai-runners", name: "Dubai runners", description: "Route notes, heat-aware pacing, and weekly meetups.", topic: "Running", member_count: 1640, post_count: 506, accent: "orange" },
  { id: id("6", 4), slug: "fuelmode-kitchen", name: "Fuelmode kitchen", description: "Practical meals for real training weeks.", topic: "Nutrition", member_count: 2180, post_count: 744, accent: "reward" },
];

export const previewPosts: Post[] = [
  { id: id("7", 1), title: "Your warm-up should earn its place", body: "Eight minutes: controlled circles, wall slides, then two light ramp sets. Save the fatigue for the work sets.", demo_media_url: "/demo/training-setup.png", kind: "coach_tip", reaction_count: 84, comment_count: 11, created_at: at(0, 10), profiles: previewPeople[0], communities: previewCommunities[0] },
  { id: id("7", 2), title: "Easy run stayed easy", body: "Thirty-two minutes at conversational pace. The small win was finishing with enough energy to train tomorrow.", kind: "milestone", reaction_count: 37, comment_count: 6, created_at: at(0, 9), profiles: previewPeople[3], communities: previewCommunities[2] },
  { id: id("7", 3), title: "A useful rep-speed rule", body: "If the last clean rep changes the shape of the movement, the set is finished. Progress does not require a technical miss.", kind: "coach_tip", reaction_count: 112, comment_count: 19, created_at: at(-1, 18), profiles: previewPeople[1], communities: previewCommunities[0] },
  { id: id("7", 4), title: "Third session done", body: "Nothing dramatic—three sessions this week, all logged. That was the target.", kind: "milestone", reaction_count: 55, comment_count: 8, created_at: at(-1, 12), profiles: previewPeople[4], communities: previewCommunities[1] },
];

export const previewChallenges: Challenge[] = [
  { id: id("b", 1), slug: "monthly-consistency", name: "Monthly consistency", description: "Complete twelve movement sessions without chasing perfect weeks.", metric: "sessions", target: 12, unit: "sessions", starts_on: day(-5), ends_on: day(25), participant_count: 1284, reward_coins: 240, accent: "orange" },
  { id: id("b", 2), slug: "mobility-seven", name: "Mobility seven", description: "Log ten deliberate minutes on seven different days.", metric: "days", target: 7, unit: "days", starts_on: day(-2), ends_on: day(12), participant_count: 842, reward_coins: 120, accent: "green" },
  { id: id("b", 3), slug: "five-km-faceoff", name: "5 km Face-Off", description: "Compare one verified five-kilometre effort with a matched training partner.", metric: "distance", target: 5, unit: "km", starts_on: day(0), ends_on: day(14), participant_count: 316, reward_coins: 180, accent: "cyan" },
];

export const previewCoaches: Coach[] = previewPeople.slice(0, 3).map((profile, index) => ({
  id: id("3", index + 1), coaching_type: index === 1 ? "coachsphere" : "fitsphere",
  specialties: [["strength", "mobility", "live classes"], ["barbell", "hypertrophy", "programming"], ["mobility", "recovery", "beginner"]][index],
  rating: [4.92, 4.88, 4.95][index], review_count: [86, 64, 51][index], session_count: [412, 289, 201][index],
  currency: "USD", base_price: [60, 75, 50][index], response_hours: [8, 12, 6][index], profiles: profile,
  coach_packages: [{ id: id("31", index + 1), name: ["Strength reset", "Barbell foundations", "Move better"][index], description: ["A four-week training reset with two live technique reviews.", "Six weeks of individual programming and weekly form review.", "Three guided mobility sessions and a repeatable daily plan."][index], duration_weeks: [4, 6, 3][index], session_count: [2, 6, 3][index], price: [210, 390, 130][index], currency: "USD" }],
  coach_availability: [{ id: id("32", index + 1), starts_at: at(index + 2), ends_at: at(index + 2, 15), timezone: "Asia/Dubai" }],
}));

export const previewProducts: Product[] = [
  { id: id("9", 1), slug: "full-circle-monthly", name: "Full Circle", description: "Mindflow, Fuelmode, premium programs, and class replays.", product_type: "subscription", price: 15, currency: "USD", coin_price: null, accent: "cyan" },
  { id: id("9", 2), slug: "barbell-base-program", name: "Barbell base", description: "Eight-week beginner strength program with three weekly sessions.", product_type: "program", price: 35, currency: "USD", coin_price: 1200, accent: "orange" },
  { id: id("9", 3), slug: "mobility-desk", name: "Desk reset pack", description: "Five guided mobility sessions for long work days.", product_type: "digital", price: 12, currency: "USD", coin_price: 360, accent: "green" },
  { id: id("9", 4), slug: "training-log-template", name: "Training log template", description: "A printable twelve-week strength log.", product_type: "digital", price: 5, currency: "USD", coin_price: 180, accent: "reward" },
];

export const previewConversations: Conversation[] = [
  { id: id("8", 1), title: "Maya · technique review", kind: "direct", updated_at: at(0, 11), messages: [
    { id: id("81", 1), body: "Keep one rep in reserve on the last set. Send the top set when you finish.", status: "read", created_at: at(-1, 11), sender_user_id: null, profiles: previewPeople[0] },
    { id: id("81", 2), body: "Got it. I will attach the set after the session.", status: "read", created_at: at(-1, 12), sender_user_id: null, profiles: previewPeople[4] },
    { id: id("81", 3), body: "Good. The first two reps were the cleanest—match that pace.", status: "sent", created_at: at(0, 11), sender_user_id: null, profiles: previewPeople[0] },
  ] },
  { id: id("8", 2), title: "Strength room · moderators", kind: "group", updated_at: at(0, 10), messages: [{ id: id("81", 4), body: "The weekly form-check thread is open. Keep clips under thirty seconds.", status: "sent", created_at: at(0, 10), sender_user_id: null, profiles: previewPeople[1] }] },
  { id: id("8", 3), title: "Healthy Life support", kind: "support", updated_at: at(0, 8), messages: [{ id: id("81", 5), body: "Your local demo data can be reset at any time from the Supabase CLI.", status: "sent", created_at: at(0, 8), sender_user_id: null, profiles: previewPeople[2] }] },
];

export const previewOperations: Operation[] = [
  { id: id("a", 1), reference: "FC-2841", area: "Moderation", title: "Community report requires evidence review", severity: "high", status: "review", owner_label: "Unassigned", detail: "Synthetic queue item; contains no member data.", updated_at: at(0, 11) },
  { id: id("a", 2), reference: "COACH-017", area: "Coaches", title: "Coach verification document check", severity: "medium", status: "review", owner_label: "A. Rahman", detail: "Synthetic verification record.", updated_at: at(0, 10) },
  { id: id("a", 3), reference: "CAT-7455EFA", area: "Catalog", title: "Exercise import ready for approval", severity: "low", status: "open", owner_label: "Catalog team", detail: "Pinned data-only snapshot; restricted media is excluded.", updated_at: at(0, 9) },
  { id: id("a", 4), reference: "RF-0912", area: "Finance", title: "Refund simulation", severity: "medium", status: "open", owner_label: "Finance", detail: "Sandbox-only transaction; no money moved.", updated_at: at(0, 8) },
];

export const previewFlags = [
  { key: "anonymous_local_demo", description: "Create an anonymous local identity for mutation testing.", enabled: true, audience: "local", updated_at: at(-1) },
  { key: "mindflow_reflections", description: "Enable private reflection prompts.", enabled: true, audience: "full_circle", updated_at: at(-1) },
  { key: "fuelmode_suggestions", description: "Enable non-diagnostic meal suggestions.", enabled: true, audience: "full_circle", updated_at: at(-1) },
  { key: "live_video_provider", description: "External live-video integration boundary.", enabled: false, audience: "internal", updated_at: at(-1) },
  { key: "payment_provider", description: "External payment integration boundary.", enabled: false, audience: "internal", updated_at: at(-1) },
];

export function previewWellness() {
  const checkins = Array.from({ length: 7 }, (_, index) => ({ id: id("c", index + 1), mood: [3, 4, 3, 5, 4, 4, 5][index], energy: [3, 3, 4, 4, 3, 5, 4][index], sleep_hours: [7, 7.5, 6.5, 8, 7, 7.5, 8][index], soreness: [2, 2, 3, 1, 2, 1, 1][index], note: "Synthetic sample check-in", checked_on: day(-index), created_at: at(-index) }));
  const meals = [
    { id: id("d", 1), meal_type: "Lunch", eaten_at: at(0, 12), notes: "Synthetic sample meal", meal_items: [{ id: id("e", 1), name: "Chicken, rice and vegetables", quantity: 1, unit: "bowl", calories: 620, protein_g: 42, carbs_g: 72, fat_g: 18 }] },
    { id: id("d", 2), meal_type: "Breakfast", eaten_at: at(-1, 8), notes: "Synthetic sample meal", meal_items: [{ id: id("e", 2), name: "Yogurt, oats and berries", quantity: 1, unit: "bowl", calories: 410, protein_g: 24, carbs_g: 55, fat_g: 11 }] },
    { id: id("d", 3), meal_type: "Dinner", eaten_at: at(-2, 19), notes: "Synthetic sample meal", meal_items: [{ id: id("e", 3), name: "Salmon and potatoes", quantity: 1, unit: "plate", calories: 690, protein_g: 39, carbs_g: 65, fat_g: 28 }] },
  ];
  const journals = [{ id: id("f", 1), title: "A steady week", body: "Synthetic example: I completed the sessions I planned and left room for recovery.", created_at: at(-1) }];
  return { checkins, meals, journals, demoLoaded: true, flags: previewFlags.filter((flag) => ["mindflow_reflections", "fuelmode_suggestions"].includes(flag.key)) };
}

export function previewCompletedWorkouts(): Workout[] {
  return [5, 3, 1].map((offset, index) => ({ ...previewWorkouts()[index], id: id("e", index + 1), owner_id: "synthetic-preview", is_template: false, status: "completed", completed_at: at(-offset), workout_exercises: previewWorkouts()[index].workout_exercises.map((exercise) => ({ ...exercise, workout_sets: [{ id: id("d", index + 1), set_number: 1, weight_kg: 25 + index * 10, reps: 8, rpe: 7, is_warmup: false, completed_at: at(-offset) }] })) }));
}
