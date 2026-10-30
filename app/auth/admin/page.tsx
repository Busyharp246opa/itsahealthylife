import { redirect } from "next/navigation";
import { OperatorLogin } from "../../components/operator-login";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { isOperatorRole } from "../../../lib/workspace-routing";

export const metadata = { title: "Admin sign in" };

export default async function AdminSignInPage() {
  const offlinePreview = await isOfflinePreview();
  if (!offlinePreview) {
    const db = await createServerSupabaseClient();
    const { data: { user } } = await db.auth.getUser();
    if (user && !user.is_anonymous) {
      const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
      if (isOperatorRole(profile?.role)) redirect("/admin");
    }
  }
  return <div className="fc-auth-card"><p className="fc-auth-eyebrow">Healthy Life administration</p><h1>Sign in to the admin panel.</h1><p>Use an account with an operator role. Access is checked against your saved profile after sign in.</p><OperatorLogin dataAvailable={!offlinePreview} /></div>;
}
