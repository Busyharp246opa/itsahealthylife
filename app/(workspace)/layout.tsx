import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { WorkspaceShell } from "../components/workspace-shell";
import { getShellIdentity } from "../../lib/fitcircle-data";
import { isOfflinePreview } from "../../lib/supabase/availability";

export const dynamic = "force-dynamic";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const offlinePreview = await isOfflinePreview();
  let signedIn = false;
  if (!offlinePreview) {
    const supabase = await createServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    signedIn = !!auth.user && !auth.user.is_anonymous;
    if (signedIn && auth.user) {
      const { data: application } = await supabase.from("trainer_applications").select("status").eq("applicant_id", auth.user.id).maybeSingle();
      if (application && application.status !== "approved") redirect("/auth/pending");
    }
  }
  const profile = signedIn ? await getShellIdentity() : null;
  return <WorkspaceShell profile={profile} signedIn={signedIn} offlinePreview={offlinePreview}>{children}</WorkspaceShell>;
}
