"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";
import { isOperatorRole } from "../../lib/workspace-routing";

export function OperatorLogin({ dataAvailable = true }: { dataAvailable?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const db = createBrowserSupabaseClient();
    const { data, error: authError } = await db.auth.signInWithPassword({
      email: String(values.get("email") ?? ""),
      password: String(values.get("password") ?? ""),
    });
    if (authError || !data.user) { setPending(false); setError(authError?.message ?? "Sign-in failed."); return; }
    const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("user_id", data.user.id).maybeSingle();
    if (profileError || !isOperatorRole(profile?.role)) {
      await db.auth.signOut();
      setPending(false);
      setError(profileError ? "Could not verify this account's admin access." : "This account does not have admin access.");
      return;
    }
    localStorage.removeItem("fc-session-only");
    sessionStorage.removeItem("fc-session-active");
    router.push("/admin");
    router.refresh();
  }
  return <form onSubmit={submit} className="fc-form fc-operator-login" aria-busy={pending}><label><span>Operator email</span><input name="email" type="email" autoComplete="username" required /></label><label><span>Password</span><span className="fc-password-wrap"><input name="password" type={passwordVisible ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setPasswordVisible((visible) => !visible)} aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible}>{passwordVisible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}</button></span></label><button type="submit" className="fc-button fc-button--primary" disabled={pending || !dataAvailable}>{pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : null}{pending ? "Signing in…" : "Sign in"}</button>{error ? <p role="alert" className="fc-form-result fc-form-result--error">{error}</p> : null}</form>;
}
