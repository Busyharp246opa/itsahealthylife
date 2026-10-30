import Link from "next/link";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { PageHeader } from "../../components/workspace-ui";

export const metadata = { title: "My plan" };

export default async function MyPlanPage() {
  if (await isOfflinePreview()) return <div className="fc-page"><PageHeader eyebrow="Your coaching" title="My plan." description="Saved plans appear here when local Supabase is available." /><section className="fc-panel"><p>Start the local data service to view your trainer’s saved guidance.</p></section></div>;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return <div className="fc-page"><PageHeader eyebrow="Your coaching" title="My plan." description="Sign in to see guidance saved for your account by your trainer." /><section className="fc-panel"><Link className="fc-button fc-button--primary" href="/auth/login">Sign in</Link></section></div>;

  const { data: plan } = await db.from("trainer_client_care_plans")
    .select("trainer_id,training_plan,diet_plan,recovery_plan,other_guidance,updated_at")
    .eq("trainee_id", user.id).maybeSingle();
  const { data: trainer } = plan?.trainer_id ? await db.from("profiles").select("display_name").eq("user_id", plan.trainer_id).maybeSingle() : { data: null };
  const sections = plan ? [
    ["Training plan", plan.training_plan],
    ["Diet plan", plan.diet_plan],
    ["Recovery and wellness", plan.recovery_plan],
    ["Other guidance", plan.other_guidance],
  ] : [];
  return <div className="fc-page"><PageHeader eyebrow="Your coaching" title="My plan." description="Training, diet, recovery, and other guidance saved by your trainer for you." />
    {plan ? <><p className="fc-local-note">Last saved {new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updated_at))}{trainer?.display_name ? ` by ${trainer.display_name}` : ""}. This guidance remains visible to you if you turn sharing off; your trainer then loses access.</p><div className="fc-focus-dashboard">{sections.map(([title, content]) => <section className="fc-panel" key={title}><h2>{title}</h2><p className="fc-plan-copy">{content || "No guidance added yet."}</p></section>)}</div></> : <section className="fc-panel"><h2>No trainer plan yet</h2><p>Choose an approved trainer and enable sharing in Settings. When they save your plan, it will appear here.</p><Link className="fc-button fc-button--primary" href="/settings?tab=profile">Manage trainer sharing</Link></section>}
    <p className="fc-local-note">Your own workout and meal logs are separate from this plan. Private journal entries are not shared with trainers.</p>
  </div>;
}
