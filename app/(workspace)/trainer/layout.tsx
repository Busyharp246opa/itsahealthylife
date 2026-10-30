import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { workspaceHome } from "../../../lib/workspace-routing";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  if (await isOfflinePreview()) return children;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) redirect("/auth/login");
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "coachsphere") redirect(workspaceHome(profile?.role));
  const { data: onboarding } = await db.from("trainer_onboarding").select("must_change_password").eq("user_id", user.id).maybeSingle();
  if (onboarding?.must_change_password) redirect("/auth/change-password");
  return children;
}
