import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { ChangePasswordForm } from "../auth-forms";
export default async function Page() { const supabase = await createServerSupabaseClient(); const { data: auth } = await supabase.auth.getUser(); if (!auth.user) redirect("/auth/login"); const { data: onboarding } = await supabase.from("trainer_onboarding").select("must_change_password").eq("user_id", auth.user.id).maybeSingle(); if (!onboarding?.must_change_password) redirect("/trainer/clients"); return <div className="fc-auth-card"><p className="fc-auth-eyebrow">First sign in</p><h1>Set your own password.</h1><p>Replace your temporary password before opening your trainer account.</p><ChangePasswordForm /></div>; }
