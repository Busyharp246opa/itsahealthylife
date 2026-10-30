"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { createAdminSupabaseClient } from "../lib/supabase/admin";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string): ActionResult => ({ status: "success", message });

async function signed() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  return user ? { db, user } : null;
}

async function superAdmin() {
  const session = await signed();
  if (!session || session.user.is_anonymous) return null;
  const profile = await session.db.from("profiles").select("role").eq("user_id", session.user.id).single();
  if (profile.data?.role !== "super_admin") return null;
  try { return { ...session, admin: createAdminSupabaseClient() }; } catch { return null; }
}

export async function createSupportTicket(_: ActionResult, data: FormData): Promise<ActionResult> {
  const subject = String(data.get("subject") ?? "").trim();
  const body = String(data.get("body") ?? "").trim();
  const category = String(data.get("category") ?? "");
  if (subject.length < 4 || subject.length > 120 || body.length < 4 || body.length > 4000 || !["account", "community", "training", "other"].includes(category)) return fail("Add a subject, category and message within the form limits.");
  const session = await signed();
  if (!session || session.user.is_anonymous) return fail("Sign in to open a support ticket.");
  const result = await session.db.from("support_tickets").insert({ owner_id: session.user.id, subject, body, category }).select("id").single();
  if (result.error) return fail(result.error.message);
  revalidatePath("/support");
  return { status: "success", message: "Support ticket opened locally.", href: `/support/${result.data.id}` };
}

export async function replySupportTicket(_: ActionResult, data: FormData): Promise<ActionResult> {
  const body = String(data.get("body") ?? "").trim();
  const ticketId = String(data.get("ticketId") ?? "");
  if (body.length < 4 || body.length > 4000) return fail("Reply in 4 to 4,000 characters.");
  const session = await signed();
  if (!session || session.user.is_anonymous) return fail("Sign in to reply.");
  const result = await session.db.from("support_messages").insert({ ticket_id: ticketId, author_id: session.user.id, body });
  if (result.error) return fail(result.error.message);
  revalidatePath(`/support/${ticketId}`);
  return ok("Reply saved locally.");
}

export async function operatorReplySupportTicket(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can manage support tickets until delegated scopes are approved.");
  const ticketId = String(data.get("ticketId") ?? "");
  const body = String(data.get("body") ?? "").trim();
  const status = String(data.get("status") ?? "");
  if (body.length < 4 || body.length > 4000 || !["open", "in_review", "resolved"].includes(status)) return fail("Add a valid reply and status.");
  const ticket = await session.admin.from("support_tickets").select("id").eq("id", ticketId).maybeSingle();
  if (!ticket.data) return fail("Ticket not found.");
  const reply = await session.admin.from("support_messages").insert({ ticket_id: ticketId, author_id: session.user.id, body });
  if (reply.error) return fail(reply.error.message);
  const updated = await session.admin.from("support_tickets").update({ status }).eq("id", ticketId);
  if (updated.error) return fail(updated.error.message);
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "support_reply", entity_type: "support_ticket", entity_id: ticketId, metadata: { status } });
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/support/${ticketId}`);
  return ok("Reply and status saved.");
}

export async function operatorSaveGuidelines(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can edit guidelines until delegated scopes are approved.");
  const body = String(data.get("body") ?? "").trim();
  if (body.length < 20 || body.length > 10000) return fail("Write guidelines in 20 to 10,000 characters.");
  const result = await session.admin.from("community_guidelines").update({ body, updated_by: session.user.id }).eq("id", "main");
  if (result.error) return fail(result.error.message);
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "guidelines_update", entity_type: "community_guidelines", entity_id: "main" });
  revalidatePath("/admin/guidelines");
  revalidatePath("/circle");
  return ok("Community guidelines published locally.");
}

export async function reportPost(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await signed();
  if (!session || session.user.is_anonymous) return fail("Sign in to report a post.");
  const reason = String(data.get("reason") ?? "");
  const detail = String(data.get("detail") ?? "").trim();
  const postId = String(data.get("postId") ?? "");
  if (!["harassment", "spam", "unsafe", "other"].includes(reason) || detail.length > 1000) return fail("Choose a reason and keep details under 1,000 characters.");
  const result = await session.db.from("post_reports").insert({ reporter_id: session.user.id, post_id: postId, reason, detail });
  if (result.error?.code === "23505") return ok("You already reported this post.");
  if (result.error) return fail(result.error.message);
  return ok("Report sent to the local moderation queue.");
}

export async function setUserBlock(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await signed();
  if (!session || session.user.is_anonymous) return fail("Sign in to manage blocked people.");
  const blockedUserId = String(data.get("userId") ?? "");
  const intent = String(data.get("intent") ?? "");
  if (!blockedUserId || blockedUserId === session.user.id || !["block", "unblock"].includes(intent)) return fail("Choose another person.");
  const result = intent === "block"
    ? await session.db.from("user_blocks").upsert({ owner_id: session.user.id, blocked_user_id: blockedUserId })
    : await session.db.from("user_blocks").delete().eq("owner_id", session.user.id).eq("blocked_user_id", blockedUserId);
  if (result.error) return fail(result.error.message);
  revalidatePath("/circle");
  revalidatePath("/settings");
  return ok(intent === "block" ? "Person hidden from your feed." : "Person unblocked.");
}

export async function operatorReviewPostReport(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can review reports until delegated scopes are approved.");
  const id = String(data.get("id") ?? "");
  const status = String(data.get("status") ?? "");
  const action = String(data.get("postAction") ?? "");
  if (!["reviewed", "dismissed"].includes(status)) return fail("Choose a review result.");
  if (!["keep", "hide"].includes(action) || (status === "dismissed" && action === "hide")) return fail("Choose a valid content decision.");
  const report = await session.admin.from("post_reports").select("id,post_id,status").eq("id", id).maybeSingle();
  if (report.error || !report.data || report.data.status !== "open") return fail("Open report not found.");
  if (action === "hide") {
    const hidden = await session.admin.from("posts").update({ status: "hidden" }).eq("id", report.data.post_id);
    if (hidden.error) return fail(hidden.error.message);
  }
  const result = await session.admin.from("post_reports").update({ status }).eq("id", id).eq("status", "open").select("id").maybeSingle();
  if (result.error || !result.data) return fail("Report changed elsewhere. Refresh and try again.");
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "post_report_review", entity_type: "post_report", entity_id: id, metadata: { status, post_action: action, post_id: report.data.post_id } });
  revalidatePath("/admin/post-reports");
  revalidatePath("/circle");
  return ok(action === "hide" ? "Report reviewed and post hidden from the public feed." : "Report reviewed; post remains visible.");
}

export async function operatorCreateChallenge(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can create platform challenges.");
  const name = String(data.get("name") ?? "").trim();
  const description = String(data.get("description") ?? "").trim();
  const metricName = String(data.get("metric") ?? "").trim();
  const unit = String(data.get("unit") ?? "").trim();
  const target = Number(data.get("target"));
  const startsOn = String(data.get("startsOn") ?? "");
  const endsOn = String(data.get("endsOn") ?? "");
  if (name.length < 4 || name.length > 100 || description.length < 10 || description.length > 2000 || metricName.length < 2 || metricName.length > 50 || unit.length < 1 || unit.length > 30 || !Number.isFinite(target) || target <= 0 || target > 1000000 || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || startsOn > endsOn) return fail("Check the challenge name, rules, target and date window.");
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55)}-${crypto.randomUUID().slice(0, 8)}`;
  const result = await session.admin.from("challenges").insert({ slug, name, description, metric: metricName, unit, target, starts_on: startsOn, ends_on: endsOn, reward_coins: 0, status: "published" }).select("id").single();
  if (result.error) return fail(result.error.message);
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "platform_challenge_create", entity_type: "challenge", entity_id: result.data.id });
  revalidatePath("/admin/challenges");
  revalidatePath("/challenges");
  return ok("Platform challenge published with no coin reward.");
}

export async function operatorCreateCommunity(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can create communities until delegated scopes are approved.");
  const name = String(data.get("name") ?? "").trim();
  const description = String(data.get("description") ?? "").trim();
  const topic = String(data.get("topic") ?? "").trim();
  if (name.length < 3 || name.length > 80 || description.length < 10 || description.length > 1000 || topic.length < 2 || topic.length > 60) return fail("Check the community name, topic and description.");
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 55)}-${crypto.randomUUID().slice(0, 8)}`;
  const result = await session.admin.from("communities").insert({ slug, name, description, topic, is_private: false }).select("id").single();
  if (result.error) return fail(result.error.message);
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "community_create", entity_type: "community", entity_id: result.data.id });
  revalidatePath("/admin/community");
  revalidatePath("/circle");
  return ok("Public community created.");
}

export async function operatorSendLocalNotification(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await superAdmin();
  if (!session) return fail("Only a super admin can send local notifications until delegated scopes are approved.");
  const campaignId = String(data.get("campaignId") ?? "");
  const title = String(data.get("title") ?? "").trim();
  const body = String(data.get("body") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(campaignId) || title.length < 4 || title.length > 120 || body.length < 4 || body.length > 2000) return fail("Add a title and message within the form limits.");
  const existing = await session.admin.from("notification_campaigns").select("id,created_by,title,body").eq("id", campaignId).maybeSingle();
  if (existing.error) return fail(existing.error.message);
  if (existing.data && (existing.data.created_by !== session.user.id || existing.data.title !== title || existing.data.body !== body)) return fail("This send reference belongs to a different message.");
  if (!existing.data) {
    const created = await session.admin.from("notification_campaigns").insert({ id: campaignId, created_by: session.user.id, title, body });
    if (created.error) return fail(created.error.message);
  }
  let sent = 0;
  for (let start = 0; ; start += 500) {
    const page = await session.admin.from("profiles").select("user_id").not("user_id", "is", null).order("id").range(start, start + 499);
    if (page.error) return fail(page.error.message);
    const recipients = [...new Set((page.data ?? []).map((row) => row.user_id).filter((id): id is string => !!id))];
    if (recipients.length) {
      const result = await session.admin.from("notifications").upsert(recipients.map((owner_id) => ({ owner_id, campaign_id: campaignId, kind: "admin_message", title, body, href: "/notifications" })), { onConflict: "campaign_id,owner_id", ignoreDuplicates: true });
      if (result.error) return fail(result.error.message);
      sent += recipients.length;
    }
    if ((page.data?.length ?? 0) < 500) break;
  }
  const updated = await session.admin.from("notification_campaigns").update({ recipient_count: sent }).eq("id", campaignId);
  if (updated.error) return fail(updated.error.message);
  await session.admin.from("audit_events").insert({ actor_id: session.user.id, action: "local_notification_send", entity_type: "notification_campaign", entity_id: campaignId, metadata: { recipient_count: sent } });
  revalidatePath("/admin/notifications");
  revalidatePath("/notifications");
  return ok(`Saved to ${sent} local inbox${sent === 1 ? "" : "es"}. No push or email was sent.`);
}

export async function markLocalNotificationRead(_: ActionResult, data: FormData): Promise<ActionResult> {
  const session = await signed();
  if (!session) return fail("Sign in to update notifications.");
  const result = await session.db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", String(data.get("id") ?? "")).eq("owner_id", session.user.id).select("id").maybeSingle();
  if (result.error || !result.data) return fail("Notification not found.");
  revalidatePath("/notifications");
  return ok("Marked as read.");
}
