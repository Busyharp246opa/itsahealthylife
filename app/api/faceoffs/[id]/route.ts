import { createAdminSupabaseClient } from "../../../../lib/supabase/admin";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../lib/supabase/availability";
import { advanceFaceoff } from "../../../../lib/faceoff-live-server";
import { createFaceoffStage, deleteFaceoffStage, issueFaceoffToken } from "../../../../lib/faceoff-stream";

type Params = { params: Promise<{ id: string }> };
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function context(id: string) {
  if (!idPattern.test(id) || await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "member") return null;
  const { data: match } = await db.from("faceoff_matches")
    .select("id,creator_user_id,opponent_user_id,circle_space,status,goal")
    .eq("id", id).eq("circle_space", "trainee").maybeSingle();
  if (!match) return null;
  const { data: event } = await db.from("faceoff_live_events").select("*").eq("match_id", id).maybeSingle();
  if (!event) return null;
  return { db, user, match, event };
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const current = await context(id);
  if (!current) return error("Face Off unavailable.", 404);
  try {
    await advanceFaceoff(current.event);
  } catch (cause) {
    console.error("[Healthy Life Face Off] advance", id, cause);
  }
  const { data: event } = await current.db.from("faceoff_live_events").select("*").eq("match_id", id).single();
  const { data: tally } = await current.db.from("faceoff_vote_tallies")
    .select("creator_votes,opponent_votes").eq("match_id", id).maybeSingle();
  if (!event) return error("Face Off unavailable.", 404);
  const participant = [current.match.creator_user_id, current.match.opponent_user_id].includes(current.user.id);
  const { data: vote } = !participant && event.state === "voting"
    ? await createAdminSupabaseClient().from("faceoff_votes").select("candidate_user_id")
      .eq("match_id", id).eq("voter_user_id", current.user.id).maybeSingle()
    : { data: null };
  return Response.json({
    state: event.state,
    startsAt: event.starts_at,
    liveStartedAt: event.live_started_at,
    creatorReady: Boolean(event.creator_ready_at),
    opponentReady: Boolean(event.opponent_ready_at),
    votingClosesAt: event.voting_closes_at,
    durationMinutes: event.duration_minutes,
    winnerUserId: event.winner_user_id,
    result: event.result,
    tally: tally ?? { creator_votes: 0, opponent_votes: 0 },
    hasVoted: Boolean(vote),
    canReady: participant && current.match.status === "active" && event.state === "scheduled" &&
      Date.now() >= new Date(event.starts_at).getTime() - 10 * 60_000 && Date.now() <= new Date(event.starts_at).getTime() + 30 * 60_000,
    canStart: participant && current.match.status === "active" && event.state === "scheduled" &&
      Boolean(event.creator_ready_at && event.opponent_ready_at) &&
      Date.now() >= new Date(event.starts_at).getTime() && Date.now() <= new Date(event.starts_at).getTime() + 30 * 60_000,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: Params) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return error("Invalid request origin.", 403);
  const { id } = await params;
  const current = await context(id);
  if (!current) return error("Face Off unavailable.", 404);
  const body = await request.json().catch(() => null) as { action?: string; candidateUserId?: string } | null;
  if (!body) return error("Invalid request.", 400);
  const participant = [current.match.creator_user_id, current.match.opponent_user_id].includes(current.user.id);
  if (body.action === "ready") {
    const scheduled = new Date(current.event.starts_at).getTime();
    if (!participant || current.match.status !== "active" || current.event.state !== "scheduled" ||
      Date.now() < scheduled - 10 * 60_000 || Date.now() > scheduled + 30 * 60_000) return error("You cannot mark ready yet.", 409);
    const update = current.user.id === current.match.creator_user_id
      ? { creator_ready_at: new Date().toISOString() } : { opponent_ready_at: new Date().toISOString() };
    const result = await createAdminSupabaseClient().from("faceoff_live_events").update(update)
      .eq("match_id", id).eq("state", "scheduled");
    if (result.error) return error("Could not save readiness.", 503);
    return Response.json({ ready: true });
  }
  if (body.action === "start") {
    const scheduled = new Date(current.event.starts_at).getTime();
    if (!participant || current.match.status !== "active" || current.event.state !== "scheduled" ||
      !current.event.creator_ready_at || !current.event.opponent_ready_at ||
      Date.now() < scheduled || Date.now() > scheduled + 30 * 60_000) return error("This Face Off cannot start now.", 409);
    let stageArn: string;
    try { stageArn = await createFaceoffStage(id); }
    catch (cause) { console.error("[Healthy Life Face Off] stage creation", id, cause); return error("Live video is not configured or available.", 503); }
    const result = await createAdminSupabaseClient().from("faceoff_live_events")
      .update({ state: "live", stage_arn: stageArn, live_started_at: new Date().toISOString() })
      .eq("match_id", id).eq("state", "scheduled").select("match_id").maybeSingle();
    if (result.error || !result.data) {
      await deleteFaceoffStage(stageArn).catch((cause) => console.error("[Healthy Life Face Off] orphan stage", stageArn, cause));
      return error("Someone else started this Face Off. Refresh the page.", 409);
    }
    return Response.json({ state: "live" });
  }
  if (body.action === "token") {
    if (current.match.status !== "active" || current.event.state !== "live" || !current.event.stage_arn) return error("Live video is unavailable.", 409);
    const finish = new Date(current.event.live_started_at ?? current.event.starts_at).getTime() + current.event.duration_minutes * 60_000;
    if (Date.now() >= finish) return error("The live round has ended.", 409);
    const side = current.user.id === current.match.creator_user_id ? "creator"
      : current.user.id === current.match.opponent_user_id ? "opponent" : "viewer";
    try {
      const token = await issueFaceoffToken(current.event.stage_arn, side, Math.ceil((finish - Date.now()) / 60_000) + 2);
      return Response.json({ token, side }, { headers: { "Cache-Control": "no-store" } });
    } catch (cause) {
      console.error("[Healthy Life Face Off] token", id, cause);
      return error("Live video is temporarily unavailable.", 503);
    }
  }
  if (body.action === "vote") {
    if (participant || current.match.status !== "active" || current.event.state !== "voting" ||
      !body.candidateUserId || !idPattern.test(body.candidateUserId)) return error("Voting is unavailable.", 409);
    const result = await createAdminSupabaseClient().rpc("record_faceoff_vote", {
      p_match_id: id, p_candidate: body.candidateUserId, p_voter: current.user.id,
    });
    if (result.error) return error(result.error.code === "23505" ? "You have already voted." : "Your vote could not be saved.", 409);
    return Response.json({ saved: true });
  }
  return error("Unknown Face Off action.", 400);
}
