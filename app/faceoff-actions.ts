"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { createAdminSupabaseClient } from "../lib/supabase/admin";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string): ActionResult => ({ status: "success", message });

function refresh() {
  for (const path of ["/faceoff", "/trainer/faceoff", "/discover", "/trainer/discover"]) revalidatePath(path);
}

async function signedCircle() {
  if (await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const { data: profile } = await db.from("profiles").select("role,is_verified").eq("user_id", user.id).maybeSingle();
  if (!profile) return null;
  const space = profile.is_verified && ["coachsphere", "fitsphere"].includes(profile.role) ? "trainer" : "trainee";
  return { db, user, space };
}

export async function createFaceoff(_: ActionResult, form: FormData): Promise<ActionResult> {
  const goal = String(form.get("goal") ?? "").trim();
  const requestedSpace = String(form.get("circleSpace") ?? "");
  const startsAtIso = String(form.get("startsAtIso") ?? "");
  const startsAt = new Date(startsAtIso);
  const date = requestedSpace === "trainee" && !Number.isNaN(startsAt.getTime())
    ? startsAt.toISOString().slice(0, 10) : String(form.get("targetDate") ?? "");
  const inviteeId = String(form.get("inviteeId") ?? "");
  const duration = Number(form.get("durationMinutes"));
  const rules = String(form.get("rules") ?? "").trim();
  const rewardTitle = String(form.get("rewardTitle") ?? "").trim();
  if (goal.length < 8 || goal.length > 240) return fail("Describe a goal in 8–240 characters.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date + "T00:00:00Z"))) return fail("Choose a valid target date.");
  const today = new Date().toISOString().slice(0, 10);
  const latest = new Date(Date.now() + 366 * 86_400_000).toISOString().slice(0, 10);
  if (date < today || date > latest) return fail("Choose a date within the next year.");
  if (requestedSpace === "trainee") {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(startsAtIso) ||
      startsAt.getTime() < Date.now() + 5 * 60_000 || startsAt.getTime() > Date.now() + 366 * 86_400_000) {
      return fail("Schedule the live Face Off at least five minutes from now and within the next year.");
    }
    if (!Number.isInteger(duration) || duration < 5 || duration > 60) return fail("Choose a duration between 5 and 60 minutes.");
    if (rules.length < 12 || rules.length > 1200) return fail("Write clear rules in 12–1200 characters.");
    if (rewardTitle.length < 3 || rewardTitle.length > 80) return fail("Name the digital recognition reward in 3–80 characters.");
  }
  if (inviteeId && !/^[0-9a-f-]{36}$/i.test(inviteeId)) return fail("Choose a valid person.");
  const context = await signedCircle();
  if (!context) return fail("Sign in to create a Face Off.");
  if (requestedSpace !== context.space) return fail("Choose your own Circle.");
  if (context.space === "trainee" && !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Live Face Off is not configured on this server yet.");
  if (inviteeId === context.user.id) return fail("Choose someone else to challenge.");
  if (inviteeId) {
    const { data: invitee } = await context.db.from("profiles")
      .select("user_id,role,is_verified").eq("user_id", inviteeId).eq("is_public", true).maybeSingle();
    const sameSpace = invitee && (context.space === "trainer"
      ? invitee.is_verified && ["coachsphere", "fitsphere"].includes(invitee.role)
      : invitee.role === "member");
    if (!sameSpace) return fail("That person is not available in this Circle.");
  }
  const result = await context.db.from("faceoff_matches").insert({
    creator_user_id: context.user.id,
    invitee_user_id: inviteeId || null,
    opponent_user_id: null,
    circle_space: context.space,
    goal,
    target_date: date,
    status: inviteeId ? "invited" : "open",
    live_enabled: context.space === "trainee",
  }).select("id").single();
  if (result.error) return fail(result.error.message);
  if (context.space === "trainee") {
    try {
      const admin = createAdminSupabaseClient();
      const event = await admin.from("faceoff_live_events").insert({
        match_id: result.data.id,
        starts_at: startsAt.toISOString(),
        duration_minutes: duration,
        rules,
        reward_title: rewardTitle,
      });
      if (event.error) {
        await admin.from("faceoff_matches").delete().eq("id", result.data.id);
        return fail("The live event could not be saved. Please try again.");
      }
    } catch {
      await createAdminSupabaseClient().from("faceoff_matches").delete().eq("id", result.data.id);
      return fail("Live Face Off needs the server database key to be configured.");
    }
  }
  refresh();
  return ok(inviteeId ? "Challenge sent." : "Open challenge posted.");
}

export async function respondToFaceoff(matchId: string, decision: "accept" | "decline" | "cancel", _: ActionResult): Promise<ActionResult> {
  void _;
  if (!/^[0-9a-f-]{36}$/i.test(matchId)) return fail("Invalid Face Off.");
  const context = await signedCircle();
  if (!context) return fail("Sign in to respond.");
  const { data: match } = await context.db.from("faceoff_matches")
    .select("creator_user_id,invitee_user_id,status,circle_space").eq("id", matchId).maybeSingle();
  if (!match || match.circle_space !== context.space) return fail("Face Off unavailable.");
  const isCreator = match.creator_user_id === context.user.id;
  const isInvitee = match.invitee_user_id === context.user.id;
  if (decision === "cancel" ? !isCreator || !["open", "invited"].includes(match.status)
    : isCreator || (match.status === "invited" && !isInvitee) || !["open", "invited"].includes(match.status)) {
    return fail("This Face Off can no longer be changed.");
  }
  if (decision === "decline" && !isInvitee) return fail("Only the invited person can decline.");
  const status = decision === "accept" ? "active" : decision === "decline" ? "declined" : "cancelled";
  const result = await context.db.from("faceoff_matches")
    .update(decision === "accept" ? { status, opponent_user_id: context.user.id } : { status })
    .eq("id", matchId).eq("status", match.status).select("id").maybeSingle();
  if (result.error || !result.data) return fail("Someone else responded first. Refresh and try again.");
  refresh();
  return ok(decision === "accept" ? "Challenge accepted." : decision === "decline" ? "Challenge declined." : "Challenge cancelled.");
}
