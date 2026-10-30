"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";
import { getSupabaseConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, key);
  }
  return browserClient;
}
