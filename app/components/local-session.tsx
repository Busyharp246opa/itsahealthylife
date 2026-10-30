"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

let localSessionPromise: Promise<{ created: boolean; error: Error | null }> | undefined;

export function resetLocalSession() {
  localSessionPromise = undefined;
}

function ensureLocalSession() {
  if (!localSessionPromise) {
    localSessionPromise = (async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) return { created: false, error: sessionError };
      if (data.session) return { created: false, error: null };

      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { display_name: "Local member" } },
      });
      return { created: !error, error };
    })();
  }
  return localSessionPromise;
}

export function LocalSession({ offlinePreview = false }: { offlinePreview?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<"starting" | "ready" | "sign_in" | "error">("starting");

  useEffect(() => {
    if (offlinePreview) return;
    let mounted = true;

    async function startSession() {
      const { created, error } = await ensureLocalSession();
      if (!mounted) return;
      if (error) {
        setStatus(error.message === "Anonymous sign-ins are disabled" ? "sign_in" : "error");
        return;
      }
      setStatus("ready");
      if (created) router.refresh();
    }

    void startSession();
    return () => {
      mounted = false;
    };
  }, [router, offlinePreview]);

  if (offlinePreview) return <span className="fc-stack-status fc-stack-status--error"><i aria-hidden />Offline preview</span>;
  if (status === "sign_in") return <Link href="/auth/login" className="fc-stack-status fc-stack-status--error"><i aria-hidden />Sign in to save</Link>;

  return (
    <span className={`fc-stack-status fc-stack-status--${status}`} title="Supabase session">
      <i aria-hidden />
      {status === "ready" ? "Connected" : status === "error" ? "Session unavailable" : "Starting session"}
    </span>
  );
}
