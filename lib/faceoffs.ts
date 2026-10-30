import { createServerSupabaseClient } from "./supabase/server";
import { isOfflinePreview } from "./supabase/availability";

export type FaceoffMatch = {
  id: string;
  creator_user_id: string;
  invitee_user_id: string | null;
  live_enabled: boolean;
  opponent_user_id: string | null;
  circle_space: "trainee" | "trainer";
  goal: string;
  target_date: string;
  status: string;
  created_at: string;
};

export async function getFaceoffMatches(space: "trainee" | "trainer"): Promise<FaceoffMatch[]> {
  if (await isOfflinePreview()) return [];
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return [];
  const { data, error } = await db.from("faceoff_matches")
    .select("id,creator_user_id,invitee_user_id,opponent_user_id,circle_space,goal,target_date,status,created_at,live_enabled")
    .eq("circle_space", space).order("created_at", { ascending: false }).limit(50);
  if (error) {
    console.error("[Healthy Life faceoffs]", error.message);
    return [];
  }
  return (data ?? []) as FaceoffMatch[];
}

export async function getFaceoffLiveEvents(matchIds: string[]) {
  if (!matchIds.length || await isOfflinePreview()) return [];
  const db = await createServerSupabaseClient();
  const { data, error } = await db.from("faceoff_live_events")
    .select("match_id,starts_at,duration_minutes,state,reward_title")
    .in("match_id", matchIds);
  if (error) {
    console.error("[Healthy Life Face Off events]", error.message);
    return [];
  }
  return data ?? [];
}
