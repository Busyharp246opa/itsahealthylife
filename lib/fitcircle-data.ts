import { createServerSupabaseClient } from "./supabase/server";
import { isOfflinePreview } from "./supabase/availability";
import { previewChallenges, previewCoaches, previewCommunities, previewCompletedWorkouts, previewConversations, previewExercises, previewFacets, previewFlags, previewOperations, previewPeople, previewPosts, previewProducts, previewPrograms, previewWellness, previewWorkouts } from "./preview-data";

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  initials: string;
  role: string;
  headline: string;
  location: string;
  bio: string;
  avatar_tone: string;
  is_verified: boolean;
  is_public?: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  target: string;
  muscle_group: string;
  secondary_muscles: string[];
  instructions: string;
  steps: string[];
  instructions_by_locale: Record<string, string>;
  instruction_steps_by_locale: Record<string, string[]>;
  media_id: string;
  image_path: string;
  gif_path: string;
  media_attribution: string;
  media_license_status: string;
  source_created_at: string | null;
  source_url: string;
  source_license: string;
};

export const EXERCISE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "pl", label: "Polish" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
] as const;

export type WorkoutExercise = {
  id: string;
  position: number;
  target_sets: number;
  target_reps: string;
  rest_seconds: number;
  workout_sets: Array<{
    id: string;
    set_number: number;
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    is_warmup: boolean;
    completed_at: string | null;
  }>;
  exercise_catalog: Pick<Exercise, "id" | "name" | "body_part" | "target" | "equipment"> | null;
};

export type Workout = {
  id: string;
  owner_id: string | null;
  name: string;
  status: string;
  scheduled_for: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  notes: string;
  is_template: boolean;
  workout_exercises: WorkoutExercise[];
};

export type Program = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  level: string;
  weeks: number;
  sessions_per_week: number;
  accent: string;
  profiles: Pick<Profile, "display_name" | "handle" | "initials" | "is_verified"> | null;
  program_sessions: Array<{
    id: string;
    week_number: number;
    day_number: number;
    title: string;
    duration_minutes: number;
    focus: string;
  }>;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string;
  topic: string;
  member_count: number;
  post_count: number;
  accent: string;
};

export type Post = {
  id: string;
  author_user_id?: string | null;
  title: string;
  body: string;
  media_path?: string | null;
  media_type?: string | null;
  media_alt?: string;
  demo_media_url?: string;
  kind: string;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  profiles: Pick<Profile, "display_name" | "handle" | "initials" | "role" | "avatar_tone" | "is_verified"> | null;
  communities: Pick<Community, "name" | "slug"> | null;
  comments?: Array<{ id: string; body: string; created_at: string; parent_comment_id: string | null; profiles: Pick<Profile, "display_name" | "handle" | "avatar_tone"> | null }>;
  liked_by_me?: boolean;
};

export type Coach = {
  id: string;
  coaching_type: string;
  specialties: string[];
  rating: number;
  review_count: number;
  session_count: number;
  currency: string;
  base_price: number;
  response_hours: number;
  profiles: Profile | null;
  coach_packages: Array<{
    id: string;
    name: string;
    description: string;
    duration_weeks: number;
    session_count: number;
    price: number;
    currency: string;
  }>;
  coach_availability: Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    timezone: string;
  }>;
};

export type Challenge = {
  id: string;
  slug: string;
  name: string;
  description: string;
  metric: string;
  target: number;
  unit: string;
  starts_on: string;
  ends_on: string;
  participant_count: number;
  reward_coins: number;
  accent: string;
};

export type Conversation = {
  id: string;
  title: string;
  kind: string;
  updated_at: string;
  messages: Array<{
    id: string;
    body: string;
    status: string;
    created_at: string;
    sender_user_id: string | null;
    profiles: Pick<Profile, "display_name" | "initials" | "avatar_tone"> | null;
    message_attachments?: Array<{ id: string; file_name: string; mime_type: string; byte_size: number }>;
  }>;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  product_type: string;
  price: number;
  currency: string;
  coin_price: number | null;
  accent: string;
};

export type Operation = {
  id: string;
  reference: string;
  area: string;
  title: string;
  severity: string;
  status: string;
  owner_label: string;
  detail: string;
  updated_at: string;
};

function rows<T>(data: unknown, error: { message: string } | null, label: string): T[] {
  if (error) console.error(`[Healthy Life data] ${label}: ${error.message}`);
  return (data ?? []) as T[];
}

function row<T>(data: unknown, error: { message: string } | null, label: string): T | null {
  if (error) console.error(`[Healthy Life data] ${label}: ${error.message}`);
  return (data ?? null) as T | null;
}

const workoutSelect = "id, owner_id, name, status, scheduled_for, started_at, completed_at, duration_minutes, notes, is_template, workout_exercises(id, position, target_sets, target_reps, rest_seconds, workout_sets(id, set_number, weight_kg, reps, rpe, is_warmup, completed_at), exercise_catalog(id, name, body_part, target, equipment))";
const publicWorkoutSelect = "id, owner_id, name, status, scheduled_for, started_at, completed_at, duration_minutes, notes, is_template, workout_exercises(id, position, target_sets, target_reps, rest_seconds, exercise_catalog(id, name, body_part, target, equipment))";

function publicWorkouts(data: unknown, error: { message: string } | null, label: string): Workout[] {
  const templates = rows<Workout>(data, error, label);
  return templates.map((workout) => ({
    ...workout,
    workout_exercises: workout.workout_exercises.map((exercise) => ({ ...exercise, workout_sets: [] })),
  }));
}

export async function getShellIdentity() {
  if (await isOfflinePreview()) return null;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;
  const result = await supabase
    .from("profiles")
    .select("id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  return row<Profile>(result.data, result.error, "shell identity");
}

export async function getTodayData() {
  if (await isOfflinePreview()) return { catalogCount: previewExercises().length, workouts: previewWorkouts(), posts: previewPosts.slice(0, 3), challenges: previewChallenges, programs: previewPrograms, flags: previewFlags };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [catalog, workouts, posts, challenges, programs, flags] = await Promise.all([
    supabase.from("exercise_catalog").select("id", { count: "exact", head: true }),
    (user ? supabase
      .from("workouts")
      .select(workoutSelect) : supabase.from("workouts").select(publicWorkoutSelect))
      .eq("is_template", true)
      .order("scheduled_for")
      .limit(3),
    user ? supabase
      .from("posts")
      .select("id, title, body, kind, reaction_count, comment_count, created_at, profiles(display_name, handle, initials, role, avatar_tone, is_verified), communities(name, slug)")
      .order("created_at", { ascending: false })
      .limit(3) : Promise.resolve({ data: [], error: null }),
    supabase.from("challenges").select("*").order("starts_on", { ascending: false }).limit(3),
    supabase.from("programs").select("id, title, slug, summary, level, weeks, sessions_per_week, accent, profiles(display_name, handle, initials, is_verified), program_sessions(id, week_number, day_number, title, duration_minutes, focus)").limit(3),
    supabase.from("feature_flags").select("key, enabled"),
  ]);

  return {
    catalogCount: catalog.count ?? 0,
    workouts: user ? rows<Workout>(workouts.data, workouts.error, "today workouts") : publicWorkouts(workouts.data, workouts.error, "today workouts"),
    posts: rows<Post>(posts.data, posts.error, "today posts"),
    challenges: rows<Challenge>(challenges.data, challenges.error, "today challenges"),
    programs: rows<Program>(programs.data, programs.error, "today programs"),
    flags: rows<{ key: string; enabled: boolean }>(flags.data, flags.error, "feature flags"),
  };
}

export async function getExerciseCatalog(filters: {
  query?: string;
  category?: string;
  equipment?: string;
  target?: string;
  page?: number;
}) {
  if (await isOfflinePreview()) {
    const page = Math.max(0, filters.page ?? 0);
    const pageSize = 24;
    const filtered = previewExercises().filter((exercise) =>
      (!filters.query || exercise.name.toLowerCase().includes(filters.query.toLowerCase())) &&
      (!filters.category || exercise.category === filters.category) &&
      (!filters.equipment || exercise.equipment === filters.equipment) &&
      (!filters.target || exercise.target === filters.target));
    return { exercises: filtered.slice(page * pageSize, (page + 1) * pageSize), count: filtered.length, page, pageSize };
  }
  const supabase = await createServerSupabaseClient();
  const page = Math.max(0, filters.page ?? 0);
  const pageSize = 24;
  let query = supabase
    .from("exercise_catalog")
    .select("id, name, category, body_part, equipment, target, muscle_group, secondary_muscles, instructions, steps, instructions_by_locale, instruction_steps_by_locale, media_id, image_path, gif_path, media_attribution, media_license_status, source_created_at, source_url, source_license", { count: "exact" })
    .order("name")
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (filters.query) query = query.ilike("name", `%${filters.query.replaceAll("%", "")}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.equipment) query = query.eq("equipment", filters.equipment);
  if (filters.target) query = query.eq("target", filters.target);
  const result = await query;
  return { exercises: rows<Exercise>(result.data, result.error, "exercise catalog"), count: result.count ?? 0, page, pageSize };
}

export async function getExercise(id: string) {
  if (await isOfflinePreview()) return previewExercises().find((exercise) => exercise.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase
    .from("exercise_catalog")
    .select("id, name, category, body_part, equipment, target, muscle_group, secondary_muscles, instructions, steps, instructions_by_locale, instruction_steps_by_locale, media_id, image_path, gif_path, media_attribution, media_license_status, source_created_at, source_url, source_license")
    .eq("id", id)
    .maybeSingle();
  return row<Exercise>(result.data, result.error, "exercise detail");
}

export async function getTrainingData() {
  if (await isOfflinePreview()) {
    const { categories, equipment, targets } = previewFacets();
    return { workouts: previewWorkouts(), programs: previewPrograms, catalogCount: previewExercises().length,
      categories, bodyParts: categories.map((item) => item.name), equipment: equipment.map((item) => item.name),
      equipmentFacets: equipment, targets: targets.map((item) => item.name), targetFacets: targets };
  }
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [workouts, programs, facets, catalog] = await Promise.all([
    supabase.from("workouts").select(user ? workoutSelect : publicWorkoutSelect).eq("is_template", true).order("scheduled_for"),
    supabase.from("programs").select("id, title, slug, summary, level, weeks, sessions_per_week, accent, profiles(display_name, handle, initials, is_verified), program_sessions(id, week_number, day_number, title, duration_minutes, focus)").order("created_at", { ascending: false }),
    supabase.rpc("get_exercise_facets"),
    supabase.from("exercise_catalog").select("id", { count: "exact", head: true }),
  ]);
  if (facets.error) console.error(`[Healthy Life data] exercise facets: ${facets.error.message}`);
  const facetData = (facets.data ?? { categories: [], equipment: [], targets: [] }) as {
    categories: Array<{ name: string; count: number }>;
    equipment: Array<{ name: string; count: number }>;
    targets: Array<{ name: string; count: number }>;
  };
  const categories = facetData.categories;
  const equipment = facetData.equipment;
  const targets = facetData.targets;
  return {
    workouts: user ? rows<Workout>(workouts.data, workouts.error, "workouts") : publicWorkouts(workouts.data, workouts.error, "workouts"),
    programs: rows<Program>(programs.data, programs.error, "programs"),
    catalogCount: catalog.count ?? 0,
    categories,
    bodyParts: categories.map((item) => item.name),
    equipment: equipment.map((item) => item.name),
    equipmentFacets: equipment,
    targets: targets.map((item) => item.name),
    targetFacets: targets,
  };
}

export async function getWorkout(id: string) {
  if (await isOfflinePreview()) return [...previewWorkouts(), ...previewCompletedWorkouts()].find((workout) => workout.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const result = await supabase.from("workouts").select(user ? workoutSelect : publicWorkoutSelect).eq("id", id).maybeSingle();
  return user ? row<Workout>(result.data, result.error, "workout detail") : publicWorkouts(result.data ? [result.data] : [], result.error, "workout detail")[0] ?? null;
}

export async function getMyWorkouts() {
  if (await isOfflinePreview()) return previewCompletedWorkouts();
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [] as Workout[];
  const result = await supabase.from("workouts")
    .select("id, owner_id, name, status, scheduled_for, started_at, completed_at, duration_minutes, notes, is_template, workout_exercises(id, position, target_sets, target_reps, rest_seconds, workout_sets(id, set_number, weight_kg, reps, rpe, is_warmup, completed_at), exercise_catalog(id, name, body_part, target, equipment))")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });
  return rows<Workout>(result.data, result.error, "my workouts");
}

export async function getProgram(slug: string) {
  if (await isOfflinePreview()) return previewPrograms.find((program) => program.slug === slug) ?? null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("programs").select("id, title, slug, summary, level, weeks, sessions_per_week, accent, profiles(display_name, handle, initials, is_verified), program_sessions(id, week_number, day_number, title, duration_minutes, focus)").eq("slug", slug).maybeSingle();
  return row<Program>(result.data, result.error, "program detail");
}

async function withPostSocial(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, feed: Post[]) {
  const postIds = feed.map((post) => post.id);
  const { data: { user } } = await supabase.auth.getUser();
  const [comments, likes] = await Promise.all([
    postIds.length ? supabase.from("post_comments").select("id,post_id,body,created_at,parent_comment_id,profiles(display_name,handle,avatar_tone)").in("post_id", postIds).order("created_at", { ascending: true }).limit(500) : Promise.resolve({ data: [], error: null }),
    user && postIds.length ? supabase.from("post_reactions").select("post_id").eq("user_id", user.id).in("post_id", postIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (comments.error || likes.error) throw new Error(comments.error?.message ?? likes.error?.message);
  const likedIds = new Set((likes.data ?? []).map((like) => like.post_id));
  return feed.map((post) => ({
    ...post,
    comments: (comments.data ?? []).filter((comment) => comment.post_id === post.id).map(({ id, body, created_at, parent_comment_id, profiles }) => ({ id, body, created_at, parent_comment_id, profiles })),
    liked_by_me: likedIds.has(post.id),
  }));
}

export async function getSocialHomeData() {
  if (await isOfflinePreview()) return { posts: previewPosts, preview: true, viewerId: null };
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return { posts: previewPosts, preview: true, viewerId: null };

  const result = await supabase.from("posts")
    .select("id, author_user_id, title, body, media_path, media_type, media_alt, kind, reaction_count, comment_count, created_at, profiles(display_name, handle, initials, role, avatar_tone, is_verified), communities(name, slug)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);
  const posts = rows<Post>(result.data, result.error, "social home posts").map((post) =>
    post.id === "70000000-0000-4000-8000-000000000001" && !post.media_path
      ? { ...post, demo_media_url: "/demo/training-setup.png" }
      : post,
  );
  return { posts: await withPostSocial(supabase, posts), preview: false, viewerId: user.id };
}

export async function getCircleData(space: "trainee" | "trainer" = "trainee") {
  if (await isOfflinePreview()) {
    const isTrainer = (role: string | undefined) => role === "coachsphere" || role === "fitsphere";
    return {
      posts: previewPosts.filter((post) => isTrainer(post.profiles?.role) === (space === "trainer")),
      communities: space === "trainee" ? previewCommunities : [],
      people: previewPeople.filter((person) => isTrainer(person.role) === (space === "trainer")),
    };
  }
  const supabase = await createServerSupabaseClient();
  const [posts, people] = await Promise.all([
    supabase.from("posts").select("id, author_user_id, title, body, media_path, media_type, media_alt, kind, reaction_count, comment_count, created_at, profiles(display_name, handle, initials, role, avatar_tone, is_verified), communities(name, slug)").eq("circle_space", space).order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified").eq("is_public", true).in("role", space === "trainer" ? ["coachsphere", "fitsphere"] : ["member"]).limit(8),
  ]);
  const feed = rows<Post>(posts.data, posts.error, "feed");
  const [communities, feedWithSocial] = await Promise.all([
    space === "trainee" ? supabase.from("communities").select("id, slug, name, description, topic, member_count, post_count, accent").order("member_count", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    withPostSocial(supabase, feed),
  ]);
  return { posts: feedWithSocial, communities: rows<Community>(communities.data, communities.error, "communities"), people: rows<Profile>(people.data, people.error, "people") };
}

export async function getCommunity(slug: string) {
  if (await isOfflinePreview()) {
    const community = previewCommunities.find((item) => item.slug === slug);
    return community ? { community, posts: previewPosts.filter((post) => post.communities?.slug === slug) } : null;
  }
  const supabase = await createServerSupabaseClient();
  const communityResult = await supabase.from("communities").select("id, slug, name, description, topic, member_count, post_count, accent").eq("slug", slug).maybeSingle();
  const community = row<Community>(communityResult.data, communityResult.error, "community detail");
  if (!community) return null;
  const postsResult = await supabase.from("posts").select("id, author_user_id, title, body, media_path, media_type, media_alt, kind, reaction_count, comment_count, created_at, profiles(display_name, handle, initials, role, avatar_tone, is_verified), communities(name, slug)").eq("community_id", community.id).eq("circle_space", "trainee").order("created_at", { ascending: false }).limit(50);
  return { community, posts: await withPostSocial(supabase, rows<Post>(postsResult.data, postsResult.error, "community posts")) };
}

export async function getProfile(handle: string) {
  if (await isOfflinePreview()) return previewPeople.find((person) => person.handle === handle) ?? null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("profiles").select("id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified").eq("handle", handle).maybeSingle();
  return row<Profile>(result.data, result.error, "profile detail");
}

export async function getCoaches() {
  if (await isOfflinePreview()) return previewCoaches;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("coach_profiles").select("id, coaching_type, specialties, rating, review_count, session_count, currency, base_price, response_hours, profiles(id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified), coach_packages(id, name, description, duration_weeks, session_count, price, currency), coach_availability(id, starts_at, ends_at, timezone)").order("rating", { ascending: false });
  return rows<Coach>(result.data, result.error, "coaches");
}

export async function getCoach(id: string) {
  if (await isOfflinePreview()) return previewCoaches.find((coach) => coach.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("coach_profiles").select("id, coaching_type, specialties, rating, review_count, session_count, currency, base_price, response_hours, profiles(id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified), coach_packages(id, name, description, duration_weeks, session_count, price, currency), coach_availability(id, starts_at, ends_at, timezone)").eq("id", id).maybeSingle();
  return row<Coach>(result.data, result.error, "coach detail");
}

export async function getChallenges() {
  if (await isOfflinePreview()) return previewChallenges;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("challenges").select("*").order("starts_on", { ascending: false });
  return rows<Challenge>(result.data, result.error, "challenges");
}

export async function getConversations() {
  if (await isOfflinePreview()) return previewConversations;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("conversations").select("id, title, kind, updated_at, messages(id, body, status, created_at, sender_user_id, profiles(display_name, initials, avatar_tone))").order("updated_at", { ascending: false });
  return rows<Conversation>(result.data, result.error, "conversations").map((conversation) => ({ ...conversation, messages: [...conversation.messages].sort((a, b) => a.created_at.localeCompare(b.created_at)) }));
}

export async function getConversation(id: string) {
  if (await isOfflinePreview()) return previewConversations.find((conversation) => conversation.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("conversations").select("id, title, kind, updated_at, messages(id, body, status, created_at, sender_user_id, profiles(display_name, initials, avatar_tone), message_attachments(id, file_name, mime_type, byte_size))").eq("id", id).maybeSingle();
  const conversation = row<Conversation>(result.data, result.error, "conversation detail");
  return conversation ? { ...conversation, messages: [...conversation.messages].sort((a, b) => a.created_at.localeCompare(b.created_at)) } : null;
}

export async function getProducts() {
  if (await isOfflinePreview()) return previewProducts;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("products").select("*").order("price");
  return rows<Product>(result.data, result.error, "products");
}

export async function getWellnessData() {
  if (await isOfflinePreview()) return previewWellness();
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    const flags = await supabase.from("feature_flags").select("key, enabled").in("key", ["mindflow_reflections", "fuelmode_suggestions"]);
    return {
      checkins: [],
      meals: [],
      journals: [],
      demoLoaded: false,
      flags: rows<{ key: string; enabled: boolean }>(flags.data, flags.error, "wellness flags"),
    };
  }
  const [checkins, meals, journals, flags, demoState] = await Promise.all([
    supabase.from("wellness_checkins").select("id, mood, energy, sleep_hours, soreness, note, checked_on, created_at").order("checked_on", { ascending: false }).limit(14),
    supabase.from("meals").select("id, meal_type, eaten_at, notes, meal_items(id, name, quantity, unit, calories, protein_g, carbs_g, fat_g)").order("eaten_at", { ascending: false }).limit(30),
    supabase.from("journal_entries").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("feature_flags").select("key, enabled").in("key", ["mindflow_reflections", "fuelmode_suggestions"]),
    supabase.from("member_demo_state").select("owner_id").eq("owner_id", userData.user.id).maybeSingle(),
  ]);
  return {
    checkins: rows<{ id: string; mood: number; energy: number; sleep_hours: number | null; soreness: number; note: string; checked_on: string; created_at: string }>(checkins.data, checkins.error, "wellness checkins"),
    meals: rows<{ id: string; meal_type: string; eaten_at: string; notes: string; meal_items: Array<{ id: string; name: string; quantity: number; unit: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }> }>(meals.data, meals.error, "meals"),
    journals: rows<{ id: string; title: string; body: string; created_at: string }>(journals.data, journals.error, "journal entries"),
    demoLoaded: Boolean(demoState.data),
    flags: rows<{ key: string; enabled: boolean }>(flags.data, flags.error, "wellness flags"),
  };
}

export async function getMeal(id: string) {
  if (await isOfflinePreview()) return previewWellness().meals.find((meal) => meal.id === id) ?? null;
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const result = await supabase.from("meals")
    .select("id, meal_type, eaten_at, notes, meal_items(id, name, quantity, unit, calories, protein_g, carbs_g, fat_g)")
    .eq("id", id).eq("owner_id", auth.user.id).maybeSingle();
  return row<{ id: string; meal_type: string; eaten_at: string; notes: string; meal_items: Array<{ id: string; name: string; quantity: number; unit: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }> }>(result.data, result.error, "meal detail");
}

export async function getCalendarData() {
  if (await isOfflinePreview()) return {
    workouts: previewWorkouts().map(({ id, name, status, scheduled_for, duration_minutes, is_template }) => ({ id, name, status, scheduled_for, duration_minutes, is_template })),
    bookings: [], availability: previewCoaches.flatMap((coach) => coach.coach_availability.map((slot) => ({ ...slot, coach_profiles: { id: coach.id, profiles: coach.profiles ? { display_name: coach.profiles.display_name, initials: coach.profiles.initials } : null } }))),
  };
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const bookingsPromise = userData.user
    ? supabase.from("bookings").select("id, status, starts_at, coach_profiles(id, profiles(display_name, initials))").order("starts_at")
    : Promise.resolve({ data: [], error: null });
  const [workouts, bookings, availability] = await Promise.all([
    supabase.from("workouts").select("id, name, status, scheduled_for, duration_minutes, is_template").not("scheduled_for", "is", null).order("scheduled_for"),
    bookingsPromise,
    supabase.from("coach_availability").select("id, starts_at, ends_at, timezone, coach_profiles(id, profiles(display_name, initials))").order("starts_at").limit(8),
  ]);
  return {
    workouts: rows<{ id: string; name: string; status: string; scheduled_for: string | null; duration_minutes: number | null; is_template: boolean }>(workouts.data, workouts.error, "calendar workouts"),
    bookings: rows<{ id: string; status: string; starts_at: string; coach_profiles: { id: string; profiles: { display_name: string; initials: string } | null } | null }>(bookings.data, bookings.error, "calendar bookings"),
    availability: rows<{ id: string; starts_at: string; ends_at: string; timezone: string; coach_profiles: { id: string; profiles: { display_name: string; initials: string } | null } | null }>(availability.data, availability.error, "calendar availability"),
  };
}

export async function getOperations() {
  if (await isOfflinePreview()) return { queue: previewOperations, flags: previewFlags, counts: { profiles: previewPeople.length, coaches: previewCoaches.length, exercises: previewExercises().length } };
  const supabase = await createServerSupabaseClient();
  const [queue, flags, profiles, coaches, exercises] = await Promise.all([
    supabase.from("operations_queue").select("*").order("updated_at", { ascending: false }),
    supabase.from("feature_flags").select("key, description, enabled, audience, updated_at").order("key"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("coach_profiles").select("id", { count: "exact", head: true }),
    supabase.from("exercise_catalog").select("id", { count: "exact", head: true }),
  ]);
  return {
    queue: rows<Operation>(queue.data, queue.error, "operations queue"),
    flags: rows<{ key: string; description: string; enabled: boolean; audience: string; updated_at: string }>(flags.data, flags.error, "flags"),
    counts: { profiles: profiles.count ?? 0, coaches: coaches.count ?? 0, exercises: exercises.count ?? 0 },
  };
}

export async function getOperatorData() {
  if (await isOfflinePreview()) return { role: null as string | null, audit: [], requests: [] };
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { role: null as string | null, audit: [], requests: [] };
  const profile = await supabase.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  const role = profile.data?.role ?? null;
  if (!role || !["moderator", "support", "finance_admin", "catalog_admin", "super_admin"].includes(role)) return { role: null as string | null, audit: [], requests: [] };
  const [audit, requests] = await Promise.all([
    supabase.from("audit_events").select("id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("data_requests").select("id, request_type, status, created_at, completed_at").order("created_at", { ascending: false }).limit(50),
  ]);
  return {
    role,
    audit: rows<{ id: number; action: string; entity_type: string; entity_id: string; metadata: unknown; created_at: string }>(audit.data, audit.error, "operator audit"),
    requests: rows<{ id: string; request_type: string; status: string; created_at: string; completed_at: string | null }>(requests.data, requests.error, "operator requests"),
  };
}

export async function getSettingsData() {
  if (await isOfflinePreview()) return { profile: null, consents: [], subscriptions: [], wallet: [], requests: [], preferences: { reminder_day: true, reminder_hour: true, reminder_ten_minutes: false, weekly_digest: true } };
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const defaultPreferences = { reminder_day: true, reminder_hour: true, reminder_ten_minutes: false, weekly_digest: true };
  if (!userData.user) return { profile: null, consents: [], subscriptions: [], wallet: [], requests: [], preferences: defaultPreferences };
  const [profile, consents, subscriptions, wallet, requests, preferences] = await Promise.all([
    supabase.from("profiles").select("id, handle, display_name, initials, role, headline, location, bio, avatar_tone, is_verified, is_public").eq("user_id", userData.user.id).maybeSingle(),
    supabase.from("consent_grants").select("scope, granted, expires_at, updated_at").order("scope"),
    supabase.from("subscriptions").select("plan, status, current_period_end"),
    supabase.from("wallet_transactions").select("amount, transaction_type, description, created_at").order("created_at", { ascending: false }),
    supabase.from("data_requests").select("id, request_type, status, created_at, completed_at").order("created_at", { ascending: false }),
    supabase.from("notification_preferences").select("reminder_day, reminder_hour, reminder_ten_minutes, weekly_digest").eq("owner_id", userData.user.id).maybeSingle(),
  ]);
  return {
    profile: row<Profile>(profile.data, profile.error, "settings profile"),
    consents: rows<{ scope: string; granted: boolean; expires_at: string | null; updated_at: string }>(consents.data, consents.error, "consents"),
    subscriptions: rows<{ plan: string; status: string; current_period_end: string | null }>(subscriptions.data, subscriptions.error, "subscriptions"),
    wallet: rows<{ amount: number; transaction_type: string; description: string; created_at: string }>(wallet.data, wallet.error, "wallet"),
    requests: rows<{ id: string; request_type: string; status: string; created_at: string; completed_at: string | null }>(requests.data, requests.error, "data requests"),
    preferences: row<typeof defaultPreferences>(preferences.data, preferences.error, "notification preferences") ?? defaultPreferences,
  };
}
