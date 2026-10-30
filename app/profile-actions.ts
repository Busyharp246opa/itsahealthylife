"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { getLocalSuperAdmin } from "../lib/supabase/super-admin";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string): ActionResult => ({ status: "success", message });

async function member() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  return user && !user.is_anonymous ? { db, user } : null;
}

export async function saveBasicProfile(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await member();
  if (!signed) return fail("Sign in to a registered account to save profile details.");
  const first_name = String(data.get("firstName") ?? "").trim();
  const last_name = String(data.get("lastName") ?? "").trim();
  const phone = String(data.get("phone") ?? "").trim();
  const country = String(data.get("country") ?? "").trim();
  const city = String(data.get("city") ?? "").trim();
  if ([first_name, last_name, country, city].some((value) => value.length > 80) || phone.length > 25 || (phone && !/^[+0-9() .-]+$/.test(phone))) return fail("Check the field lengths and phone characters.");
  const result = await signed.db.from("member_profile_details").upsert({ owner_id: signed.user.id, first_name, last_name, phone, country, city }, { onConflict: "owner_id" });
  if (result.error) return fail(result.error.message);
  revalidatePath("/settings");
  return ok("Private profile details saved.");
}

export async function saveDiscoveryChoices(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await member();
  if (!signed) return fail("Sign in to save discovery choices.");
  const ids = [...new Set(data.getAll("tagId").map((value) => String(value)))];
  if (ids.length > 20 || ids.some((id) => !/^[0-9a-f-]{36}$/i.test(id))) return fail("Choose up to 20 interests and prompts.");
  if (ids.length) {
    const allowed = await signed.db.from("discovery_tags").select("id").in("id", ids).eq("is_active", true);
    if (allowed.error || allowed.data?.length !== ids.length) return fail("One of the selected choices is no longer available.");
  }
  const existing = await signed.db.from("member_discovery_choices").select("tag_id").eq("owner_id", signed.user.id);
  if (existing.error) return fail(existing.error.message);
  const previous = new Set((existing.data ?? []).map((row) => row.tag_id));
  const wanted = new Set(ids);
  const additions = ids.filter((id) => !previous.has(id));
  if (additions.length) {
    const inserted = await signed.db.from("member_discovery_choices").insert(additions.map((tag_id) => ({ owner_id: signed.user.id, tag_id })));
    if (inserted.error) return fail(inserted.error.message);
  }
  const removals = [...previous].filter((id) => !wanted.has(id));
  if (removals.length) {
    const removed = await signed.db.from("member_discovery_choices").delete().eq("owner_id", signed.user.id).in("tag_id", removals);
    if (removed.error) return fail(removed.error.message);
  }
  revalidatePath("/settings");
  revalidatePath("/discover");
  return ok("Discovery interests and prompts saved.");
}

export async function operatorSaveDiscoveryTag(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await getLocalSuperAdmin();
  if (!signed) return fail("Only a super admin can manage interests and prompts until delegated scopes are approved.");
  const id = String(data.get("id") ?? "");
  const kind = String(data.get("kind") ?? "");
  const label = String(data.get("label") ?? "").trim();
  const priority = Number(data.get("priority"));
  const is_active = String(data.get("active") ?? "") === "on";
  if (!["interest", "prompt"].includes(kind) || label.length < 2 || label.length > 80 || !Number.isInteger(priority) || priority < 0 || priority > 100) return fail("Check the kind, label and priority from 0 to 100.");
  const result = id
    ? await signed.admin.from("discovery_tags").update({ kind, label, priority, is_active }).eq("id", id).select("id").maybeSingle()
    : await signed.admin.from("discovery_tags").insert({ kind, label, priority, is_active }).select("id").single();
  if (result.error || !result.data) return fail(result.error?.message ?? "Tag not found.");
  await signed.admin.from("audit_events").insert({ actor_id: signed.user.id, action: id ? "discovery_tag_update" : "discovery_tag_create", entity_type: "discovery_tag", entity_id: result.data.id });
  revalidatePath("/admin/interests");
  revalidatePath("/settings");
  revalidatePath("/discover");
  return ok("Discovery choice saved.");
}
