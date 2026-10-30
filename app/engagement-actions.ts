"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { createAdminSupabaseClient } from "../lib/supabase/admin";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string): ActionResult => ({ status: "success", message });

async function session() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  return user && !user.is_anonymous ? { db, user } : null;
}
async function superAdmin() {
  const signed = await session();
  if (!signed) return null;
  const profile = await signed.db.from("profiles").select("role").eq("user_id", signed.user.id).single();
  if (profile.data?.role !== "super_admin") return null;
  try { return { ...signed, admin: createAdminSupabaseClient() }; } catch { return null; }
}

export async function operatorCreateBadge(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await superAdmin();
  if (!signed) return fail("Only a super admin can create badges until delegated scopes are approved.");
  const title = String(data.get("title") ?? "").trim();
  const description = String(data.get("description") ?? "").trim();
  const tier = String(data.get("tier") ?? "");
  if (title.length < 3 || title.length > 80 || description.length < 10 || description.length > 1000 || !["bronze", "silver", "gold"].includes(tier)) return fail("Enter a valid title, description and tier.");
  const result = await signed.admin.from("badges").insert({ title, description, tier }).select("id").single();
  if (result.error) return fail(result.error.message);
  await signed.admin.from("audit_events").insert({ actor_id: signed.user.id, action: "badge_create", entity_type: "badge", entity_id: result.data.id });
  revalidatePath("/admin/badges");
  revalidatePath("/badges");
  return ok("Badge created with the Healthy Life symbol. Custom badge artwork remains pending.");
}

export async function operatorAwardBadge(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await superAdmin();
  if (!signed) return fail("Only a super admin can award badges until delegated scopes are approved.");
  const badgeId = String(data.get("badgeId") ?? "");
  const userId = String(data.get("userId") ?? "");
  const note = String(data.get("note") ?? "").trim();
  if (!badgeId || !userId || note.length > 500) return fail("Choose a badge and member; keep notes under 500 characters.");
  const [badge, member] = await Promise.all([
    signed.admin.from("badges").select("id").eq("id", badgeId).eq("is_active", true).maybeSingle(),
    signed.admin.from("profiles").select("user_id").eq("user_id", userId).maybeSingle(),
  ]);
  if (!badge.data || !member.data) return fail("Badge or member not found.");
  const authMember = await signed.admin.auth.admin.getUserById(userId);
  if (authMember.error || !authMember.data.user || authMember.data.user.is_anonymous) return fail("Choose a registered member.");
  const result = await signed.admin.from("badge_awards").insert({ badge_id: badgeId, recipient_user_id: userId, awarded_by: signed.user.id, note });
  if (result.error?.code === "23505") return fail("This member already has that badge.");
  if (result.error) return fail(result.error.message);
  await signed.admin.from("audit_events").insert({ actor_id: signed.user.id, action: "badge_award", entity_type: "badge", entity_id: badgeId, metadata: { recipient_user_id: userId } });
  revalidatePath("/admin/badges");
  revalidatePath("/badges");
  return ok("Badge awarded once.");
}

export async function operatorCreateSpotlight(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await superAdmin();
  if (!signed) return fail("Only a super admin can promote coaches until delegated scopes are approved.");
  const coachId = String(data.get("coachId") ?? "");
  const title = String(data.get("title") ?? "").trim();
  const startsOn = String(data.get("startsOn") ?? "");
  const endsOn = String(data.get("endsOn") ?? "");
  if (title.length < 4 || title.length > 120 || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || startsOn > endsOn) return fail("Choose a verified coach, title and valid date window.");
  const coach = await signed.admin.from("coach_profiles").select("id").eq("id", coachId).not("verified_at", "is", null).maybeSingle();
  if (!coach.data) return fail("Only verified coaches are eligible for spotlight.");
  const result = await signed.admin.from("coach_spotlights").insert({ coach_id: coachId, title, starts_on: startsOn, ends_on: endsOn }).select("id").single();
  if (result.error) return fail(result.error.message);
  await signed.admin.from("audit_events").insert({ actor_id: signed.user.id, action: "coach_spotlight_create", entity_type: "coach_spotlight", entity_id: result.data.id, metadata: { coach_id: coachId } });
  revalidatePath("/admin/spotlight");
  revalidatePath("/coaches");
  return ok("Verified coach spotlight scheduled locally.");
}

export async function operatorEndSpotlight(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await superAdmin();
  if (!signed) return fail("Only a super admin can end a spotlight.");
  const id = String(data.get("id") ?? "");
  const result = await signed.admin.from("coach_spotlights").update({ is_active: false }).eq("id", id).eq("is_active", true).select("id").maybeSingle();
  if (result.error || !result.data) return fail("Active spotlight not found.");
  await signed.admin.from("audit_events").insert({ actor_id: signed.user.id, action: "coach_spotlight_end", entity_type: "coach_spotlight", entity_id: id });
  revalidatePath("/admin/spotlight");
  revalidatePath("/coaches");
  return ok("Spotlight ended.");
}

export async function createReferralCode(previous: ActionResult, data: FormData): Promise<ActionResult> {
  void previous;
  void data;
  const signed = await session();
  if (!signed) return fail("Sign in to a registered account for a referral code.");
  let admin;
  try { admin = createAdminSupabaseClient(); } catch { return fail("Local referral service is not configured."); }
  const existing = await admin.from("referral_codes").select("code").eq("owner_id", signed.user.id).maybeSingle();
  if (existing.data) return ok("Your code is already ready below.");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = `FC${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const result = await admin.from("referral_codes").insert({ owner_id: signed.user.id, code });
    if (!result.error) { revalidatePath("/referrals"); return ok("Referral code created. No reward is attached."); }
    if (result.error.code !== "23505") return fail(result.error.message);
  }
  return fail("Could not create a unique code. Try again.");
}

export async function applyReferralCode(_: ActionResult, data: FormData): Promise<ActionResult> {
  const signed = await session();
  if (!signed) return fail("Sign in to a registered account to record a referral.");
  const code = String(data.get("code") ?? "").trim().toUpperCase();
  if (!/^FC[A-Z0-9]{10}$/.test(code)) return fail("Enter a valid Healthy Life referral code.");
  let admin;
  try { admin = createAdminSupabaseClient(); } catch { return fail("Local referral service is not configured."); }
  const referrer = await admin.from("referral_codes").select("owner_id").eq("code", code).maybeSingle();
  if (!referrer.data) return fail("Referral code not found.");
  if (referrer.data.owner_id === signed.user.id) return fail("You cannot use your own code.");
  const result = await admin.from("referral_attributions").insert({ referred_user_id: signed.user.id, referrer_user_id: referrer.data.owner_id, code });
  if (result.error?.code === "23505") return fail("This account already has a referral attribution.");
  if (result.error) return fail(result.error.message);
  revalidatePath("/referrals");
  revalidatePath("/admin/referrals");
  return ok("Referral recorded. Reward rules are still pending.");
}
