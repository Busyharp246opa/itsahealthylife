import "server-only";
import { createServerSupabaseClient } from "./server";
import { createAdminSupabaseClient } from "./admin";
import { isOfflinePreview } from "./availability";

export async function getLocalSuperAdmin() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const profile = await db.from("profiles").select("role").eq("user_id", user.id).single();
  if (profile.data?.role !== "super_admin") return null;
  try { return { user, admin: createAdminSupabaseClient() }; } catch { return null; }
}
