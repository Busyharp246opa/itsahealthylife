import { isOfflinePreview } from "./supabase/availability";
import { createServerSupabaseClient } from "./supabase/server";

export async function getApprovedTrainerSession() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const [{ data: profile }, { data: onboarding }] = await Promise.all([
    db.from("profiles").select("role,is_verified").eq("user_id", user.id).maybeSingle(),
    db.from("trainer_onboarding").select("must_change_password").eq("user_id", user.id).maybeSingle(),
  ]);
  if (profile?.role !== "coachsphere" || !profile.is_verified || !onboarding || onboarding.must_change_password) return null;
  return { db, user };
}

export async function getSharedTrainerClients(session: NonNullable<Awaited<ReturnType<typeof getApprovedTrainerSession>>>) {
  // Link RLS returns only trainees whose sharing switch and approved link are current.
  const { data: links, error } = await session.db.from("trainer_client_links")
    .select("trainee_id").eq("trainer_id", session.user.id).eq("active", true);
  if (error) throw new Error(error.message);
  const ids = (links ?? []).map((link) => link.trainee_id);
  if (!ids.length) return [];
  const [{ data: people, error: peopleError }, { data: plans, error: plansError }] = await Promise.all([
    session.db.from("profiles").select("user_id,display_name,handle").in("user_id", ids),
    session.db.from("trainer_client_care_plans").select("trainee_id,updated_at").in("trainee_id", ids),
  ]);
  if (peopleError || plansError) throw new Error(peopleError?.message ?? plansError?.message);
  const planDates = new Map((plans ?? []).map((plan) => [plan.trainee_id, plan.updated_at]));
  return (people ?? []).filter((person): person is typeof person & { user_id: string } => !!person.user_id)
    .map((person) => ({ ...person, planUpdatedAt: planDates.get(person.user_id) ?? null }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}
