"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, LoaderCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";
import { registerTrainee, registerTrainer, type AuthResult } from "./actions";
import { isOperatorRole } from "../../lib/workspace-routing";

const initial: AuthResult = { status: "idle", message: "" };

export function PasswordField({ name = "password", label = "Password", autoComplete = "new-password" }: { name?: string; label?: string; autoComplete?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="fc-auth-field"><span>{label}</span><div className="fc-password-wrap"><input name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={8} maxLength={8} required /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>;
}

export function RegistrationForm({ role }: { role: "trainee" | "trainer" }) {
  const [state, action, pending] = useActionState(role === "trainee" ? registerTrainee : registerTrainer, initial);
  return <form action={action} className="fc-auth-form" encType="multipart/form-data">
    <label className="fc-auth-field"><span>Full name</span><input name="name" autoComplete="name" minLength={2} maxLength={80} required placeholder="Your name" /></label>
    <label className="fc-auth-field"><span>Email address</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
    {role === "trainer" ? <><label className="fc-auth-field"><span>Phone <small>optional</small></span><input name="phone" type="tel" autoComplete="tel" /></label><label className="fc-auth-field"><span>Coaching specialties</span><input name="specialties" placeholder="Strength, running, mobility" /></label><label className="fc-auth-field"><span>About your coaching</span><textarea name="bio" rows={3} maxLength={1200} /></label><label className="fc-auth-field"><span>Certificates <small>optional · PDF, JPG or PNG · 5 MB max</small></span><input name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" /></label></> : null}
    <PasswordField /><PasswordField name="confirmPassword" label="Confirm password" />
    <p className="fc-auth-hint">Use exactly 8 characters. You can show or hide either field.</p>
    {role === "trainee" ? <label className="fc-auth-check"><input type="checkbox" name="coaching" /><span>I am interested in coaching. You can change this in your profile.</span></label> : <p className="fc-auth-hint">After email verification, an admin reviews your application. You can sign in after approval.</p>}
    <button className="fc-button fc-button--primary" disabled={pending} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : null}{pending ? "Submitting…" : role === "trainer" ? "Submit trainer application" : "Create trainee account"}{!pending ? <ArrowRight size={17} aria-hidden /> : null}</button>
    {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`fc-auth-feedback ${state.status}`}>{state.message} {state.href ? <Link href={state.href}>Continue</Link> : null}</p> : null}
  </form>;
}

export function LoginForm({ postAfterSignIn = false }: { postAfterSignIn?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const remember = form.get("remember") === "on";
    const supabase = createBrowserSupabaseClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") });
    if (authError || !data.user) { setError(authError?.message ?? "Sign-in failed."); setPending(false); return; }
    if (remember) { localStorage.removeItem("fc-session-only"); sessionStorage.removeItem("fc-session-active"); }
    else { localStorage.setItem("fc-session-only", "1"); sessionStorage.setItem("fc-session-active", "1"); }
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", data.user.id).maybeSingle();
    let target = "/trainee";
    if (profile?.role === "coachsphere") {
      const { data: onboarding } = await supabase.from("trainer_onboarding").select("must_change_password").eq("user_id", data.user.id).maybeSingle();
      target = onboarding?.must_change_password ? "/auth/change-password" : "/trainer";
    } else if (isOperatorRole(profile?.role)) target = "/admin";
    else {
      const { data: application } = await supabase.from("trainer_applications").select("status").eq("applicant_id", data.user.id).maybeSingle();
      if (application) target = "/auth/pending";
    }
    if (postAfterSignIn) {
      if (target === "/trainee") target = "/post";
      if (target === "/trainer") target = "/trainer/post";
    }
    router.push(target); router.refresh();
  }
  return <form onSubmit={submit} className="fc-auth-form"><label className="fc-auth-field"><span>Email address</span><input name="email" type="email" autoComplete="username" required /></label><PasswordField autoComplete="current-password" /><label className="fc-auth-check"><input type="checkbox" name="remember" defaultChecked /><span>Remember me on this device</span></label><button className="fc-button fc-button--primary" disabled={pending} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : null}{pending ? "Signing in…" : "Sign in"}{!pending ? <ArrowRight size={17} aria-hidden /> : null}</button>{error ? <p className="fc-auth-feedback error" role="alert">{error}</p> : null}</form>;
}

export function ChangePasswordForm() {
  const router = useRouter(); const [error, setError] = useState(""); const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const form = new FormData(event.currentTarget), currentPassword = String(form.get("currentPassword") ?? ""), password = String(form.get("password") ?? "");
    if (password.length !== 8 || password !== form.get("confirmPassword") || password === currentPassword) { setError("Confirm a new password of exactly 8 characters, different from the temporary one."); setPending(false); return; }
    const completed = await fetch("/auth/complete-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, password }) });
    if (!completed.ok) { const body = await completed.json().catch(() => ({})); setError(body.error ?? "Unable to change your password."); setPending(false); return; }
    await createBrowserSupabaseClient().auth.signOut();
    router.push("/auth/login?passwordChanged=1"); router.refresh();
  }
  return <form className="fc-auth-form" onSubmit={submit}><PasswordField name="currentPassword" label="Temporary password" autoComplete="current-password" /><PasswordField name="password" label="New password" /><PasswordField name="confirmPassword" label="Confirm new password" /><p className="fc-auth-hint">Your new password must be exactly 8 characters and different from the temporary password.</p><button className="fc-button fc-button--primary" disabled={pending} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : null}{pending ? "Saving…" : "Set new password"}</button>{error ? <p className="fc-auth-feedback error" role="alert">{error}</p> : null}</form>;
}
