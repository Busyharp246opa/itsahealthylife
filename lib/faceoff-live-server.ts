import "server-only";

import { createAdminSupabaseClient } from "./supabase/admin";
import { deleteFaceoffStage } from "./faceoff-stream";
import type { Database } from "./database.types";

type Event = Database["public"]["Tables"]["faceoff_live_events"]["Row"];

export async function moveFaceoffToVoting(event: Event) {
  if (event.state !== "live") return;
  const now = new Date();
  const admin = createAdminSupabaseClient();
  const result = await admin.from("faceoff_live_events")
    .update({ state: "voting", live_ended_at: now.toISOString(), voting_closes_at: new Date(now.getTime() + 2 * 60_000).toISOString() })
    .eq("match_id", event.match_id).eq("state", "live").select("match_id").maybeSingle();
  if (result.error) throw result.error;
  if (result.data && event.stage_arn) await cleanupFaceoffStage(event.match_id, event.stage_arn);
}

async function cleanupFaceoffStage(matchId: string, stageArn: string) {
  try {
    await deleteFaceoffStage(stageArn);
    const admin = createAdminSupabaseClient();
    await admin.from("faceoff_live_events").update({ stage_arn: null }).eq("match_id", matchId).eq("stage_arn", stageArn);
  } catch (error) {
    console.error("[Healthy Life Face Off] stage cleanup needs retry", matchId, error);
  }
}

export async function advanceFaceoff(event: Event) {
  const admin = createAdminSupabaseClient();
  if (event.state === "scheduled" && Date.now() > new Date(event.starts_at).getTime() + 30 * 60_000) {
    const result = await admin.from("faceoff_live_events").update({ state: "void" })
      .eq("match_id", event.match_id).eq("state", "scheduled");
    if (result.error) throw result.error;
    return;
  }
  if (event.state === "live" && event.live_started_at &&
    Date.now() >= new Date(event.live_started_at).getTime() + event.duration_minutes * 60_000) {
    await moveFaceoffToVoting(event);
    return;
  }
  if (event.state === "voting" && event.stage_arn) await cleanupFaceoffStage(event.match_id, event.stage_arn);
  if (event.state === "voting" && event.voting_closes_at && Date.now() >= new Date(event.voting_closes_at).getTime()) {
    const result = await admin.rpc("finalize_faceoff", { p_match_id: event.match_id });
    if (result.error) throw result.error;
  }
}
