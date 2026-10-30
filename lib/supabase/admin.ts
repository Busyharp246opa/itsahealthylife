import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";
import { getSupabaseConfig } from "./config";

export function createAdminSupabaseClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return createClient<Database>(getSupabaseConfig().url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
