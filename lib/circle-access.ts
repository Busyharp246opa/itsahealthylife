import { isOfflinePreview } from "./supabase/availability";
import { createServerSupabaseClient } from "./supabase/server";

export async function getTrainerCircleSession() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    db.from("profiles").select("role,is_verified").eq("user_id", user.id).maybeSingle(),
    db.from("trainer_onboarding").select("must_change_password").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!profile?.is_verified || !["coachsphere", "fitsphere"].includes(profile.role) || !onboarding || onboarding.must_change_password) return null;
  return { db, user };
}
