"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";
export function SessionPolicy() { const router = useRouter(); useEffect(() => { if (localStorage.getItem("fc-session-only") === "1" && sessionStorage.getItem("fc-session-active") !== "1") { localStorage.removeItem("fc-session-only"); void createBrowserSupabaseClient().auth.signOut().then(() => { router.replace("/auth/login"); router.refresh(); }); } }, [router]); return null; }
