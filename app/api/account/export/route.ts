import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../lib/supabase/availability";

export const dynamic = "force-dynamic";

async function allPages(fetchPage: (start: number, end: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>) {
  const result: unknown[] = [];
  for (let start = 0; ; start += 500) {
    const page = await fetchPage(start, start + 499);
    if (page.error) throw new Error(page.error.message);
    result.push(...(page.data ?? []));
    if ((page.data?.length ?? 0) < 500) return result;
  }
}

export async function GET() {
  if (await isOfflinePreview()) return Response.json({ error: "Account export needs the local Supabase service." }, { status: 503 });
  const supabase = await createServerSupabaseClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return Response.json({ error: "Sign in to export your data." }, { status: 401 });
  const uid = auth.user.id;
  try {
    const [profiles, basicDetails, discoveryChoices, traineeDetails, trainerLinks, trainerCarePlans, consents, goals, workouts, weeklyPrograms, customExercises, trainingSchedules, checkins, journals, meals, bookings, posts, reactions, postComments, postReports, userBlocks, supportTickets, messages, conversations, communities, challenges, badgeAwards, referralCodes, referralAttributions, notifications, preferences, subscriptions, wallet, requests] = await Promise.all([
      allPages((a, b) => supabase.from("profiles").select("*").eq("user_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("member_profile_details").select("*").eq("owner_id", uid).order("owner_id").range(a, b)),
      allPages((a, b) => supabase.from("member_discovery_choices").select("*").eq("owner_id", uid).order("tag_id").range(a, b)),
      allPages((a, b) => supabase.from("trainee_details").select("*").eq("owner_id", uid).order("owner_id").range(a, b)),
      allPages((a, b) => supabase.from("trainer_client_links").select("*").eq("trainee_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("trainer_client_care_plans").select("*").eq("trainee_id", uid).order("trainee_id").range(a, b)),
      allPages((a, b) => supabase.from("consent_grants").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("goals").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("workouts").select("*, workout_exercises(*, workout_sets(*))").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("trainee_programs").select("*, trainee_program_days(*, trainee_program_movements(*))").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("trainee_exercises").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("trainee_schedules").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("wellness_checkins").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("journal_entries").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("meals").select("*, meal_items(*)").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("bookings").select("*").eq("member_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("posts").select("*").eq("author_user_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("post_reactions").select("*").eq("user_id", uid).order("post_id").range(a, b)),
      allPages((a, b) => supabase.from("post_comments").select("*").eq("author_user_id", uid).order("created_at").range(a, b)),
      allPages((a, b) => supabase.from("post_reports").select("*").eq("reporter_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("user_blocks").select("*").eq("owner_id", uid).order("blocked_user_id").range(a, b)),
      allPages((a, b) => supabase.from("support_tickets").select("*, support_messages(*)").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("messages").select("*").eq("sender_user_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("conversation_members").select("*").eq("user_id", uid).order("conversation_id").range(a, b)),
      allPages((a, b) => supabase.from("community_members").select("*").eq("user_id", uid).order("community_id").range(a, b)),
      allPages((a, b) => supabase.from("challenge_participants").select("*").eq("user_id", uid).order("challenge_id").range(a, b)),
      allPages((a, b) => supabase.from("badge_awards").select("*").eq("recipient_user_id", uid).order("badge_id").range(a, b)),
      allPages((a, b) => supabase.from("referral_codes").select("*").eq("owner_id", uid).order("owner_id").range(a, b)),
      allPages((a, b) => supabase.from("referral_attributions").select("*").eq("referred_user_id", uid).order("referred_user_id").range(a, b)),
      allPages((a, b) => supabase.from("notifications").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("notification_preferences").select("*").eq("owner_id", uid).order("owner_id").range(a, b)),
      allPages((a, b) => supabase.from("subscriptions").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("wallet_transactions").select("*").eq("owner_id", uid).order("id").range(a, b)),
      allPages((a, b) => supabase.from("data_requests").select("*").eq("owner_id", uid).order("id").range(a, b)),
    ]);
    const data = { exported_at: new Date().toISOString(), account: { id: uid, email: auth.user.email ?? null, is_anonymous: auth.user.is_anonymous }, profiles, basicDetails, discoveryChoices, traineeDetails, trainerLinks, trainerCarePlans, consents, goals, workouts, weeklyPrograms, customExercises, trainingSchedules, checkins, journals, meals, bookings, posts, reactions, postComments, postReports, userBlocks, supportTickets, messages, conversations, communities, challenges, badgeAwards, referralCodes, referralAttributions, notifications, preferences, subscriptions, wallet, requests };
    return new Response(JSON.stringify(data, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="healthy-life-export-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Healthy Life export failed", error);
    return Response.json({ error: "Export could not be completed." }, { status: 500 });
  }
}
