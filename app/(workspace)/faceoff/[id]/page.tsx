import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FaceoffLiveRoom } from "../../../components/faceoff-live-room";
import { LocalDataNote, PageHeader } from "../../../components/workspace-ui";
import { isOfflinePreview } from "../../../../lib/supabase/availability";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { advanceFaceoff } from "../../../../lib/faceoff-live-server";
import { createAdminSupabaseClient } from "../../../../lib/supabase/admin";

export const metadata = { title: "Face Off live event" };

export default async function FaceoffEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  if (await isOfflinePreview()) return <div className="fc-page"><PageHeader eyebrow="Face Off" title="Live event unavailable" description="Connect to your local data to watch and vote." /><LocalDataNote>Live Face Off needs the local Supabase service.</LocalDataNote></div>;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) redirect("/auth/login");
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).maybeSingle();
  if (profile?.role !== "member") notFound();
  const { data: match } = await db.from("faceoff_matches")
    .select("id,creator_user_id,opponent_user_id,goal,status,circle_space,live_enabled")
    .eq("id", id).eq("circle_space", "trainee").maybeSingle();
  if (!match || !match.live_enabled) notFound();
  const { data: event } = await db.from("faceoff_live_events").select("*").eq("match_id", id).maybeSingle();
  if (!event) notFound();
  try { await advanceFaceoff(event); }
  catch (error) { console.error("[Healthy Life Face Off] advance during page load", id, error); }
  const [latestEvent, tallyResult, peopleResult] = await Promise.all([
    db.from("faceoff_live_events").select("*").eq("match_id", id).single(),
    db.from("faceoff_vote_tallies").select("creator_votes,opponent_votes").eq("match_id", id).maybeSingle(),
    db.from("profiles").select("user_id,display_name").in("user_id", [match.creator_user_id, match.opponent_user_id].filter((value): value is string => Boolean(value))),
  ]);
  if (!latestEvent.data) notFound();
  const people = new Map((peopleResult.data ?? []).map((person) => [person.user_id, person.display_name]));
  const participant = [match.creator_user_id, match.opponent_user_id].includes(user.id);
  const { data: vote } = !participant ? await createAdminSupabaseClient().from("faceoff_votes").select("candidate_user_id")
    .eq("match_id", id).eq("voter_user_id", user.id).maybeSingle() : { data: null };
  return <div className="fc-page fc-faceoff-event-page">
    <Link className="fc-faceoff-more" href="/faceoff">← All Face Offs</Link>
    <PageHeader eyebrow="Live Face Off" title={match.goal} description="Two competitors. One live challenge. Your Circle decides the winner." />
    <FaceoffLiveRoom matchId={id} userId={user.id} creatorId={match.creator_user_id}
      opponentId={match.opponent_user_id} creatorName={people.get(match.creator_user_id) ?? "Challenger"}
      opponentName={match.opponent_user_id ? people.get(match.opponent_user_id) ?? "Opponent" : "Awaiting opponent"}
      rules={latestEvent.data.rules} rewardTitle={latestEvent.data.reward_title}
      initial={{ state: latestEvent.data.state, startsAt: latestEvent.data.starts_at,
        liveStartedAt: latestEvent.data.live_started_at, creatorReady: Boolean(latestEvent.data.creator_ready_at),
        opponentReady: Boolean(latestEvent.data.opponent_ready_at), votingClosesAt: latestEvent.data.voting_closes_at,
        durationMinutes: latestEvent.data.duration_minutes, winnerUserId: latestEvent.data.winner_user_id,
        result: latestEvent.data.result, tally: tallyResult.data ?? { creator_votes: 0, opponent_votes: 0 },
        hasVoted: Boolean(vote), canReady: false, canStart: false }} />
  </div>;
}
