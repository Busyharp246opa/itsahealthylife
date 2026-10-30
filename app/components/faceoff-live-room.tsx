"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Radio, Trophy, UsersRound, Vote } from "lucide-react";
import type { Stage } from "amazon-ivs-web-broadcast";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

type LiveState = {
  state: string;
  startsAt: string;
  liveStartedAt: string | null;
  creatorReady: boolean;
  opponentReady: boolean;
  votingClosesAt: string | null;
  durationMinutes: number;
  winnerUserId: string | null;
  result: string | null;
  tally: { creator_votes: number; opponent_votes: number };
  hasVoted: boolean;
  canReady: boolean;
  canStart: boolean;
};

async function postAction(matchId: string, action: string, candidateUserId?: string) {
  const response = await fetch(`/api/faceoffs/${matchId}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, candidateUserId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Face Off request failed.");
  return data;
}

export function FaceoffLiveRoom({ matchId, userId, creatorId, opponentId, creatorName, opponentName, rules, rewardTitle, initial }: {
  matchId: string;
  userId: string;
  creatorId: string;
  opponentId: string | null;
  creatorName: string;
  opponentName: string;
  rules: string;
  rewardTitle: string;
  initial: LiveState;
}) {
  const [event, setEvent] = useState(initial);
  const [now, setNow] = useState(() => new Date(initial.liveStartedAt ?? initial.startsAt).getTime());
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cameraOn, setCameraOn] = useState(true);
  const [microphoneOn, setMicrophoneOn] = useState(true);
  const creatorVideo = useRef<HTMLVideoElement>(null);
  const opponentVideo = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const mediaBySide = useRef(new Map<string, MediaStream>());
  const side = userId === creatorId ? "creator" : userId === opponentId ? "opponent" : "viewer";

  const leave = useCallback(() => {
    stageRef.current?.leave();
    stageRef.current = null;
    mediaRef.current?.getTracks().forEach((track) => track.stop());
    mediaRef.current = null;
    mediaBySide.current.clear();
    for (const video of [creatorVideo.current, opponentVideo.current]) if (video) video.srcObject = null;
    setJoined(false);
  }, []);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/faceoffs/${matchId}`, { cache: "no-store" });
    if (!response.ok) return;
    setEvent(await response.json() as LiveState);
  }, [matchId]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const fallback = window.setInterval(() => { void refresh(); }, 10_000);
    const initialRefresh = window.setTimeout(() => { void refresh(); }, 0);
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`faceoff:${matchId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "faceoff_live_events", filter: `match_id=eq.${matchId}` }, () => { void refresh(); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "faceoff_vote_tallies", filter: `match_id=eq.${matchId}` }, () => { void refresh(); })
      .subscribe();
    return () => {
      window.clearInterval(clock);
      window.clearInterval(fallback);
      window.clearTimeout(initialRefresh);
      void supabase.removeChannel(channel);
      leave();
    };
  }, [matchId, refresh, leave]);

  useEffect(() => { if (event.state !== "live" && stageRef.current) leave(); }, [event.state, leave]);

  async function join() {
    if (stageRef.current || busy) return;
    setBusy(true); setMessage("");
    try {
      const { token, side: grantedSide } = await postAction(matchId, "token") as { token: string; side: string };
      const sdk = await import("amazon-ivs-web-broadcast");
      let media: MediaStream | null = null;
      let localStreams: InstanceType<typeof sdk.LocalStageStream>[] = [];
      if (grantedSide !== "viewer") {
        media = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 } },
        });
        mediaRef.current = media;
        localStreams = media.getTracks().map((track) => new sdk.LocalStageStream(track));
        const localVideo = grantedSide === "creator" ? creatorVideo.current : opponentVideo.current;
        if (localVideo) { localVideo.srcObject = media; localVideo.muted = true; void localVideo.play().catch(() => {}); }
      }
      const stage = new sdk.Stage(token, {
        stageStreamsToPublish: () => localStreams,
        shouldPublishParticipant: () => grantedSide !== "viewer",
        shouldSubscribeToParticipant: (participant) => participant.attributes.side === "viewer" ? sdk.SubscribeType.NONE : sdk.SubscribeType.AUDIO_VIDEO,
      });
      stage.on(sdk.StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, (participant, streams) => {
        const participantSide = participant.attributes.side;
        if (participantSide !== "creator" && participantSide !== "opponent") return;
        const video = participantSide === "creator" ? creatorVideo.current : opponentVideo.current;
        if (!video) return;
        const current = mediaBySide.current.get(participantSide) ?? new MediaStream();
        for (const stream of streams) {
          if (participant.isLocal && stream.streamType === sdk.StreamType.AUDIO) continue;
          if (!current.getTracks().some((track) => track.id === stream.mediaStreamTrack.id)) current.addTrack(stream.mediaStreamTrack);
        }
        mediaBySide.current.set(participantSide, current);
        video.srcObject = current;
        video.muted = participant.isLocal;
        void video.play().catch(() => setMessage("Tap a video to start audio playback."));
      });
      stage.on(sdk.StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED, (participant, streams) => {
        const participantSide = participant.attributes.side;
        if (participantSide !== "creator" && participantSide !== "opponent") return;
        const current = mediaBySide.current.get(participantSide);
        for (const stream of streams) current?.removeTrack(stream.mediaStreamTrack);
        if (!current?.getTracks().length) {
          const video = participantSide === "creator" ? creatorVideo.current : opponentVideo.current;
          if (video) video.srcObject = null;
          mediaBySide.current.delete(participantSide);
        }
      });
      stage.on(sdk.StageEvents.ERROR, () => setMessage("Video connection encountered a problem. Leave and rejoin if it persists."));
      stageRef.current = stage;
      await stage.join();
      setJoined(true);
    } catch (cause) {
      leave();
      setMessage(cause instanceof Error ? cause.message : "Could not join the live room.");
    } finally { setBusy(false); }
  }

  async function start() {
    setBusy(true); setMessage("");
    try { await postAction(matchId, "start"); await refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not start this Face Off."); }
    finally { setBusy(false); }
  }

  async function ready() {
    setBusy(true); setMessage("");
    try {
      const preview = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      preview.getTracks().forEach((track) => track.stop());
      await postAction(matchId, "ready");
      await refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Camera and microphone are required to compete."); }
    finally { setBusy(false); }
  }

  async function voteFor(candidateUserId: string) {
    setBusy(true); setMessage("");
    try { await postAction(matchId, "vote", candidateUserId); setMessage("Your vote was recorded."); await refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Your vote could not be saved."); }
    finally { setBusy(false); }
  }

  const endsAt = event.liveStartedAt ? new Date(event.liveStartedAt).getTime() + event.durationMinutes * 60_000 : 0;
  const scheduledAt = new Date(event.startsAt).getTime();
  const myReady = side === "creator" ? event.creatorReady : side === "opponent" ? event.opponentReady : false;
  const canReady = side !== "viewer" && event.state === "scheduled" && now >= scheduledAt - 10 * 60_000 && now <= scheduledAt + 30 * 60_000;
  const canStart = side !== "viewer" && event.state === "scheduled" && now >= scheduledAt && now <= scheduledAt + 30 * 60_000;
  const remaining = event.state === "live" ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
  const votingRemaining = event.state === "voting" && event.votingClosesAt ? Math.max(0, Math.ceil((new Date(event.votingClosesAt).getTime() - now) / 1000)) : 0;
  const winnerName = event.winnerUserId === creatorId ? creatorName : event.winnerUserId === opponentId ? opponentName : null;

  return <div className="fc-faceoff-live-layout">
    <div className="fc-faceoff-live-main">
      <div className="fc-faceoff-live-status"><span className={event.state === "live" ? "is-live" : ""}><Radio size={16} aria-hidden /> {event.state === "live" ? "LIVE" : event.state === "voting" ? "VOTING" : event.state === "completed" ? "RESULT" : event.state === "void" ? "CANCELLED" : "SCHEDULED"}</span>
        {event.state === "live" ? <strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} left</strong> : null}</div>
      <div className="fc-faceoff-video-grid">
        <div><video ref={creatorVideo} playsInline autoPlay muted={side === "creator"} controls={side === "viewer"} /><strong>{creatorName}</strong><small>Challenger</small></div>
        <div><video ref={opponentVideo} playsInline autoPlay muted={side === "opponent"} controls={side === "viewer"} /><strong>{opponentName}</strong><small>Opponent</small></div>
      </div>
      {event.state === "scheduled" ? <div className="fc-faceoff-live-controls"><p>Starts {new Intl.DateTimeFormat("en", { dateStyle: "full", timeStyle: "short" }).format(new Date(event.startsAt))}. Both competitors must accept and check their camera and microphone before the live round begins.</p><p>{creatorName}: {event.creatorReady ? "ready" : "waiting"} · {opponentName}: {event.opponentReady ? "ready" : "waiting"}</p>{canReady && event.canReady && !myReady ? <button className="fc-button fc-button--primary" disabled={busy} onClick={ready}><Camera size={16} aria-hidden /> Check camera and mark ready</button> : null}{canStart && event.canStart ? <button className="fc-button fc-button--primary" disabled={busy} onClick={start}>Start live Face Off</button> : null}</div> : null}
      {event.state === "void" ? <div className="fc-faceoff-live-controls"><p>This Face Off did not take place. No winner or title was awarded.</p></div> : null}
      {event.state === "live" ? <div className="fc-faceoff-live-controls"><p>{joined ? side === "viewer" ? "You are watching live." : "Your camera and microphone are connected." : "Join the live room to " + (side === "viewer" ? "watch" : "compete") + "."}</p>
        {joined ? <button className="fc-button fc-button--quiet" onClick={leave}>Leave live room</button> : <button className="fc-button fc-button--primary" disabled={busy} onClick={join}>{side === "viewer" ? <UsersRound size={16} aria-hidden /> : <Camera size={16} aria-hidden />} Join live room</button>}
        {joined && side !== "viewer" ? <><button className="fc-button fc-button--quiet" onClick={() => { mediaRef.current?.getVideoTracks().forEach((track) => { track.enabled = !cameraOn; }); setCameraOn(!cameraOn); }}>{cameraOn ? <CameraOff size={16} aria-hidden /> : <Camera size={16} aria-hidden />}{cameraOn ? "Camera off" : "Camera on"}</button><button className="fc-button fc-button--quiet" onClick={() => { mediaRef.current?.getAudioTracks().forEach((track) => { track.enabled = !microphoneOn; }); setMicrophoneOn(!microphoneOn); }}>{microphoneOn ? "Mute mic" : "Unmute mic"}</button></> : null}
      </div> : null}
      {event.state === "voting" ? <div className="fc-faceoff-voting"><h2><Vote size={21} aria-hidden /> Vote for the winner</h2><p>Voting closes in {Math.floor(votingRemaining / 60)}:{String(votingRemaining % 60).padStart(2, "0")}. One vote per spectator; competitors cannot vote.</p>{side === "viewer" && !event.hasVoted && votingRemaining > 0 ? <div className="fc-faceoff-live-controls"><button className="fc-button fc-button--primary" disabled={busy} onClick={() => voteFor(creatorId)}>Vote {creatorName}</button>{opponentId ? <button className="fc-button fc-button--primary" disabled={busy} onClick={() => voteFor(opponentId)}>Vote {opponentName}</button> : null}</div> : <p>{event.hasVoted ? "Your vote is recorded. Results appear when voting closes." : "Results appear when voting closes."}</p>}</div> : null}
      {event.state === "completed" ? <div className="fc-faceoff-result"><Trophy size={28} aria-hidden /><h2>{winnerName ? `${winnerName} wins` : "It’s a tie"}</h2>{winnerName ? <p>Digital title awarded: <strong>{rewardTitle}</strong></p> : <p>No title is awarded on a tie.</p>}<p>{creatorName}: {event.tally.creator_votes} votes · {opponentName}: {event.tally.opponent_votes} votes</p></div> : null}
      {message ? <p className="fc-form-result" role="status">{message}</p> : null}
    </div>
    <aside className="fc-panel fc-faceoff-rules"><h2>Challenge rules</h2><p>{rules}</p><dl><dt>Duration</dt><dd>{event.durationMinutes} minutes</dd><dt>Winner’s title</dt><dd>{rewardTitle}</dd><dt>Voting</dt><dd>One vote per signed spectator after the live round.</dd></dl></aside>
  </div>;
}
