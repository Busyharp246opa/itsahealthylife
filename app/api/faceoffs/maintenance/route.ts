import { createAdminSupabaseClient } from "../../../../lib/supabase/admin";
import { advanceFaceoff } from "../../../../lib/faceoff-live-server";

export async function GET(request: Request) {
  const secret = process.env.FACEOFF_MAINTENANCE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("faceoff_live_events")
    .select("*").in("state", ["scheduled", "live", "voting"]).order("starts_at").limit(100);
  if (error) return Response.json({ error: "Could not load active Face Offs." }, { status: 503 });
  let advanced = 0;
  for (const event of data ?? []) {
    try { await advanceFaceoff(event); advanced += 1; }
    catch (cause) { console.error("[Healthy Life Face Off] maintenance", event.match_id, cause); }
  }
  return Response.json({ checked: data?.length ?? 0, advanced });
}
