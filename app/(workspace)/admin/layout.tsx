import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { isOperatorRole, workspaceHome } from "../../../lib/workspace-routing";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (await isOfflinePreview()) return children;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) redirect("/auth/admin");
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (!isOperatorRole(profile?.role)) redirect(workspaceHome(profile?.role));
  return children;
}
