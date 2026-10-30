import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { GuidelinesForm } from "../../../components/flow-forms";
import { PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Community guidelines" };
export default async function AdminGuidelinesPage() {
  const db = await createServerSupabaseClient();
  const guideline = await db.from("community_guidelines").select("body,updated_at").eq("id", "main").single();
  const session = await getLocalSuperAdmin();
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Community guidelines" description="Publish the rules shown beside the Circle feed." backHref="/admin/more" /><section className="fc-panel">{session ? <GuidelinesForm body={guideline.data?.body ?? ""} /> : <p>A super admin account is required to edit guidelines.</p>}{guideline.data ? <small>Last updated {new Date(guideline.data.updated_at).toLocaleString("en-AE")}</small> : null}</section></div>;
}
