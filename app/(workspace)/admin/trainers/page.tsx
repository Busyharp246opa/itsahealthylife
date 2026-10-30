import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { addTrainer, reviewTrainer, resetTrainerTemporaryPassword } from "../../../auth/actions";
import { AdminActionForm } from "../../../components/admin-trainer-form";
import { PageHeader } from "../../../components/workspace-ui";
export const dynamic = "force-dynamic";
export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/auth/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (!profile || !["super_admin", "support"].includes(profile.role)) redirect("/admin/overview");
  const { data: applications } = await supabase.from("trainer_applications").select("*").order("created_at", { ascending: false });
  const { data: onboarding } = await supabase.from("trainer_onboarding").select("user_id").eq("source", "admin").eq("must_change_password", true);
  const { data: pendingProfiles } = onboarding?.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", onboarding.map((row) => row.user_id)) : { data: [] };
  return <div className="fc-page"><PageHeader eyebrow="Administration" title="Trainer onboarding" description="Review applications or create a trainer account and email temporary credentials." backHref="/admin/overview" /><div className="fc-focus-dashboard"><section className="fc-panel"><h2>Applications</h2>{applications?.length ? <div className="fc-trainer-applications">{applications.map((item) => <article key={item.id}><div><strong>{item.full_name}</strong><small>{item.email} · {item.status}</small>{item.phone ? <small>{item.phone}</small> : null}<p>{item.bio || "No coaching bio provided."}</p><small>{item.specialties.join(" · ")}</small>{item.certificate_path ? <Link href={`/api/admin/trainer-certificate/${item.id}`}>View certificate</Link> : null}</div>{item.status === "pending" ? <><AdminActionForm action={reviewTrainer} hidden={{ id: item.id, decision: "approved" }} button="Approve" /><AdminActionForm action={reviewTrainer} hidden={{ id: item.id, decision: "rejected" }} button="Reject" note /></> : <small>{item.review_note}</small>}</article>)}</div> : <p>No trainer applications yet.</p>}</section><section className="fc-panel"><h2>Add a trainer directly</h2><p>An 8-character temporary password is emailed via Resend. The trainer must replace it at first sign in.</p><AdminActionForm action={addTrainer} button="Create and email trainer" fields /></section></div><section className="fc-panel"><h2>Awaiting first sign in</h2>{onboarding?.length ? onboarding.map((row) => <article className="fc-trainer-pending-row" key={row.user_id}><div><strong>{pendingProfiles?.find((person) => person.user_id === row.user_id)?.display_name ?? "Trainer"}</strong><small>Must set a new password on first sign in</small></div><AdminActionForm action={resetTrainerTemporaryPassword} hidden={{ userId: row.user_id }} button="Send new temporary password" /></article>) : <p>No trainers awaiting a first password change.</p>}</section></div>;
}
