import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";
import { getSupabaseConfig } from "../../../lib/supabase/config";
import { validPassword } from "../../../lib/registration";
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email || auth.user.is_anonymous) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { data: onboarding } = await supabase.from("trainer_onboarding").select("must_change_password").eq("user_id", auth.user.id).maybeSingle();
  if (!onboarding?.must_change_password) return NextResponse.json({ error: "No password change is pending" }, { status: 409 });
  const body = await request.json().catch(() => null);
  const currentPassword = String(body?.currentPassword ?? ""), password = String(body?.password ?? "");
  if (!validPassword(password) || !validPassword(currentPassword) || password === currentPassword) return NextResponse.json({ error: "Enter a different password of exactly 8 characters." }, { status: 400 });
  const { url, key } = getSupabaseConfig();
  const verifier = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const verified = await verifier.auth.signInWithPassword({ email: auth.user.email, password: currentPassword });
  if (verified.error || verified.data.user?.id !== auth.user.id) return NextResponse.json({ error: "Temporary password is incorrect." }, { status: 403 });
  try {
    const admin = createAdminSupabaseClient();
    const updated = await admin.auth.admin.updateUserById(auth.user.id, { password });
    if (updated.error) throw updated.error;
    const profile = await admin.from("profiles").update({ is_verified: true, is_public: true }).eq("user_id", auth.user.id).select("id").single();
    if (profile.error || !profile.data) throw new Error("Profile activation failed");
    const coach = await admin.from("coach_profiles").update({ verified_at: new Date().toISOString() }).eq("profile_id", profile.data.id);
    if (coach.error) throw coach.error;
    const completed = await admin.from("trainer_onboarding").update({ must_change_password: false }).eq("user_id", auth.user.id);
    if (completed.error) throw completed.error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Account setup failed. Contact your administrator." }, { status: 503 }); }
}
