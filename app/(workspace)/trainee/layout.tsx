import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { workspaceHome } from "../../../lib/workspace-routing";

export default async function TraineeLayout({ children }: { children: React.ReactNode }) {
  if (await isOfflinePreview()) return children;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return children;
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  const home = workspaceHome(profile?.role);
  if (home !== "/trainee") redirect(home);
  return children;
}
