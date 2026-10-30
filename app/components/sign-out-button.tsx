"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";
import { resetLocalSession } from "./local-session";

export function SignOutButton({ redirectTo = "/auth/login" }: { redirectTo?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const { error: authError } = await createBrowserSupabaseClient().auth.signOut();
      if (authError) throw authError;
      resetLocalSession();
      localStorage.removeItem("fc-session-only");
      sessionStorage.removeItem("fc-session-active");
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
      setPending(false);
    }
  }

  return <div className="fc-signout-control">
    <button type="button" className="fc-button fc-button--quiet" disabled={pending} aria-busy={pending} onClick={signOut}>
      {pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : <LogOut size={16} aria-hidden />}
      {pending ? "Signing out…" : "Sign out"}
    </button>
    {error ? <small role="alert">{error}</small> : null}
  </div>;
}
