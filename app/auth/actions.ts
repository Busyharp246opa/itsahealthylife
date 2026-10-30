"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { cleanText, validEmail, validPassword } from "../../lib/registration";

export type AuthResult = { status: "idle" | "error" | "success"; message: string; href?: string };
const fail = (message: string): AuthResult => ({ status: "error", message });
const done = (message: string, href?: string): AuthResult => ({ status: "success", message, href });
const origin = () => process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://127.0.0.1:3390";

export async function registerTrainee(_: AuthResult, form: FormData): Promise<AuthResult> {
  const name = cleanText(form.get("name"), 80), email = cleanText(form.get("email"), 254).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (name.length < 2 || !validEmail(email)) return fail("Enter your name and a valid email address.");
  if (!validPassword(password) || password !== form.get("confirmPassword")) return fail("Choose and confirm a password of exactly 8 characters.");
  const supabase = await createServerSupabaseClient();
  const result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin()}/auth/confirm`, data: { registration_role: "trainee", display_name: name, coaching_opt_in: form.get("coaching") === "on" } } });
  if (result.error) return fail(result.error.message);
  return done("Check your email to verify your account, then sign in.", "/auth/verify");
}

export async function registerTrainer(_: AuthResult, form: FormData): Promise<AuthResult> {
  const name = cleanText(form.get("name"), 80), email = cleanText(form.get("email"), 254).toLowerCase();
  const password = String(form.get("password") ?? ""), certificate = form.get("certificate");
  if (name.length < 2 || !validEmail(email)) return fail("Enter your name and a valid email address.");
  if (!validPassword(password) || password !== form.get("confirmPassword")) return fail("Choose and confirm a password of exactly 8 characters.");
  if (certificate instanceof File && certificate.size && (certificate.size > 5 * 1024 * 1024 || !["application/pdf", "image/jpeg", "image/png"].includes(certificate.type))) return fail("Certificate must be a PDF, JPG, or PNG under 5 MB.");
  let admin: ReturnType<typeof createAdminSupabaseClient>;
  try { admin = createAdminSupabaseClient(); } catch { return fail("Trainer registration is not configured yet."); }
  const supabase = await createServerSupabaseClient();
  const signup = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin()}/auth/confirm`, data: { display_name: name } } });
  if (signup.error || !signup.data.user?.identities?.length) return fail(signup.error?.message ?? "Unable to register. If you have an account, please sign in.");
  const userId = signup.data.user.id;
  let certificatePath: string | null = null;
  if (certificate instanceof File && certificate.size) {
    const extension = certificate.type === "application/pdf" ? "pdf" : certificate.type === "image/png" ? "png" : "jpg";
    certificatePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const upload = await admin.storage.from("trainer-certificates").upload(certificatePath, certificate, { contentType: certificate.type });
    if (upload.error) { await admin.auth.admin.deleteUser(userId); return fail("Certificate upload failed. Submit again."); }
  }
  const saved = await admin.from("trainer_applications").insert({ applicant_id: userId, full_name: name, email, phone: cleanText(form.get("phone"), 40), bio: cleanText(form.get("bio"), 1200), specialties: cleanText(form.get("specialties"), 300).split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8), certificate_path: certificatePath });
  if (saved.error) { if (certificatePath) await admin.storage.from("trainer-certificates").remove([certificatePath]); await admin.auth.admin.deleteUser(userId); return fail("Could not save the application. Submit again."); }
  return done("Verify your email. An admin will then review your application.", "/auth/verify");
}

async function operator() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", auth.user.id).maybeSingle();
  if (!profile || !["super_admin", "support"].includes(profile.role)) return null;
  return { userId: auth.user.id, admin: createAdminSupabaseClient() };
}

export async function reviewTrainer(_: AuthResult, form: FormData): Promise<AuthResult> {
  let actor: Awaited<ReturnType<typeof operator>>;
  try { actor = await operator(); } catch { return fail("Admin service is not configured."); }
  if (!actor) return fail("Operator access is required.");
  const id = cleanText(form.get("id"), 50), decision = cleanText(form.get("decision"), 20);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["approved", "rejected"].includes(decision)) return fail("Invalid review request.");
  if (decision === "rejected" && cleanText(form.get("note"), 500).length < 3) return fail("Add a short reason for rejection.");
  const { data: application } = await actor.admin.from("trainer_applications").select("*").eq("id", id).eq("status", "pending").maybeSingle();
  if (!application) return fail("This application is no longer pending.");
  if (decision === "approved") {
    const { data: authUser } = await actor.admin.auth.admin.getUserById(application.applicant_id);
    if (!authUser.user?.email_confirmed_at) return fail("The applicant must verify their email first.");
    const { data: profile } = await actor.admin.from("profiles").select("id").eq("user_id", application.applicant_id).single();
    if (!profile) return fail("The trainer profile is unavailable.");
    const onboarding = await actor.admin.from("trainer_onboarding").upsert({ user_id: application.applicant_id, source: "application", must_change_password: false });
    if (onboarding.error) return fail("Could not finish trainer approval.");
    const coach = await actor.admin.from("coach_profiles").upsert({ profile_id: profile.id, coaching_type: "coachsphere", specialties: application.specialties, base_price: 0, verified_at: new Date().toISOString() }, { onConflict: "profile_id" });
    if (coach.error) return fail("Could not publish the trainer profile.");
    const approved = await actor.admin.from("profiles").update({ role: "coachsphere", is_verified: true, is_public: true, display_name: application.full_name, initials: application.full_name.split(/\s+/).map((s) => s[0]).join("").slice(0, 4) }).eq("user_id", application.applicant_id);
    if (approved.error) return fail("Could not approve the trainer profile.");
  }
  const review = await actor.admin.from("trainer_applications").update({ status: decision, review_note: cleanText(form.get("note"), 500), reviewed_by: actor.userId, reviewed_at: new Date().toISOString() }).eq("id", id).eq("status", "pending");
  if (review.error) return fail(review.error.message);
  await actor.admin.from("audit_events").insert({ actor_id: actor.userId, action: `trainer_${decision}`, entity_type: "trainer_application", entity_id: id, metadata: {} });
  revalidatePath("/admin/trainers");
  return done(`Trainer application ${decision}.`);
}

export async function addTrainer(_: AuthResult, form: FormData): Promise<AuthResult> {
  let actor: Awaited<ReturnType<typeof operator>>;
  try { actor = await operator(); } catch { return fail("Admin service is not configured."); }
  if (!actor) return fail("Operator access is required.");
  const name = cleanText(form.get("name"), 80), email = cleanText(form.get("email"), 254).toLowerCase();
  if (name.length < 2 || !validEmail(email)) return fail("Enter a name and valid email.");
  const apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return fail("Resend email delivery is not configured.");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(8); let password = "";
  for (const byte of bytes) password += alphabet[byte % alphabet.length];
  const created = await actor.admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name } });
  if (created.error || !created.data.user) return fail(created.error?.message ?? "Could not create trainer.");
  const userId = created.data.user.id;
  try {
    const { data: profile, error: profileError } = await actor.admin.from("profiles").update({ role: "coachsphere", is_verified: false, is_public: false, display_name: name, initials: name.split(/\s+/).map((s) => s[0]).join("").slice(0, 4) }).eq("user_id", userId).select("id").single();
    if (profileError || !profile) throw new Error("Profile setup failed");
    const coach = await actor.admin.from("coach_profiles").insert({ profile_id: profile.id, coaching_type: "coachsphere", specialties: [], base_price: 0, verified_at: null });
    if (coach.error) throw coach.error;
    const onboard = await actor.admin.from("trainer_onboarding").insert({ user_id: userId, source: "admin", must_change_password: true });
    if (onboard.error) throw onboard.error;
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: "Your Healthy Life trainer account", text: `Your Healthy Life trainer account is ready.\n\nSign in: ${origin()}/auth/login\nEmail: ${email}\nTemporary password: ${password}\n\nYou must set a new 8-character password when you sign in.` }) });
    if (!response.ok) throw new Error("Resend delivery failed");
  } catch { await actor.admin.auth.admin.deleteUser(userId); return fail("Trainer setup or email delivery failed. No account was retained; try again."); }
  await actor.admin.from("audit_events").insert({ actor_id: actor.userId, action: "trainer_added", entity_type: "trainer", entity_id: userId, metadata: {} });
  revalidatePath("/admin/trainers");
  return done("Trainer created and temporary credentials emailed.");
}

export async function resetTrainerTemporaryPassword(_: AuthResult, form: FormData): Promise<AuthResult> {
  let actor: Awaited<ReturnType<typeof operator>>;
  try { actor = await operator(); } catch { return fail("Admin service is not configured."); }
  if (!actor) return fail("Operator access is required.");
  const userId = cleanText(form.get("userId"), 50);
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return fail("Invalid trainer.");
  const apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return fail("Resend email delivery is not configured.");
  const { data: onboarding } = await actor.admin.from("trainer_onboarding").select("source, must_change_password").eq("user_id", userId).maybeSingle();
  if (onboarding?.source !== "admin" || !onboarding.must_change_password) return fail("Only pending admin-created trainers can receive a new temporary password.");
  const { data: authUser } = await actor.admin.auth.admin.getUserById(userId);
  if (!authUser.user?.email) return fail("Trainer account is unavailable.");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let password = ""; for (const byte of randomBytes(8)) password += alphabet[byte % alphabet.length];
  const updated = await actor.admin.auth.admin.updateUserById(userId, { password });
  if (updated.error) return fail("Could not reset the temporary password.");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [authUser.user.email], subject: "Your new Healthy Life temporary password", text: `Sign in at ${origin()}/auth/login with ${authUser.user.email} and temporary password ${password}. Replace it when prompted.` }) }).catch(() => null);
  if (!response?.ok) return fail("Email delivery failed. Retry to issue a fresh temporary password.");
  await actor.admin.from("audit_events").insert({ actor_id: actor.userId, action: "trainer_temporary_password_reset", entity_type: "trainer", entity_id: userId, metadata: {} });
  revalidatePath("/admin/trainers");
  return done("A new temporary password was emailed.");
}

export async function saveTraineeDetails(_: AuthResult, form: FormData): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || auth.user.is_anonymous) return fail("Sign in to save your preferences.");
  const trainerId = cleanText(form.get("trainerId"), 50), share = form.get("share") === "on";
  if (share && !/^[0-9a-f-]{36}$/i.test(trainerId)) return fail("Choose an approved trainer before sharing.");
  const detail = await supabase.from("trainee_details").upsert({ owner_id: auth.user.id, coaching_opt_in: form.get("coaching") === "on", share_with_trainer: share, fitness_goals: cleanText(form.get("fitnessGoals"), 1000), fitness_level: cleanText(form.get("fitnessLevel"), 80), training_preferences: cleanText(form.get("trainingPreferences"), 1000), diet_preferences: cleanText(form.get("dietPreferences"), 1000), diet_notes: cleanText(form.get("dietNotes"), 1000), wellness_notes: cleanText(form.get("wellnessNotes"), 1000), updated_at: new Date().toISOString() });
  if (detail.error) return fail(detail.error.message);
  const links = await supabase.from("trainer_client_links").select("id, trainer_id").eq("trainee_id", auth.user.id);
  if (links.error) return fail(links.error.message);
  for (const link of links.data ?? []) if (link.trainer_id !== trainerId || !share) await supabase.from("trainer_client_links").update({ active: false }).eq("id", link.id);
  if (share) {
    const linked = await supabase.from("trainer_client_links").upsert({ trainee_id: auth.user.id, trainer_id: trainerId, active: true }, { onConflict: "trainee_id,trainer_id" });
    if (linked.error) { await supabase.from("trainee_details").update({ share_with_trainer: false }).eq("owner_id", auth.user.id); return fail("Could not link that trainer. Your details remain private."); }
  }
  revalidatePath("/settings"); revalidatePath("/trainer/clients"); revalidatePath("/trainer/plans"); revalidatePath("/my-plan");
  return done(share ? "Preferences saved and shared with your selected trainer." : "Preferences saved privately.");
}
