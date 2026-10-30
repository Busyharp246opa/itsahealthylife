import Link from "next/link";
import { CalendarDays, Radio, Swords, UsersRound } from "lucide-react";
import { getFaceoffLiveEvents, getFaceoffMatches } from "../../lib/faceoffs";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { isOfflinePreview } from "../../lib/supabase/availability";
import { FaceoffCreateForm, FaceoffResponseForm } from "./faceoff-forms";
import { LocalDataNote, PageHeader, StatusBadge } from "./workspace-ui";

export async function FaceoffHub({ space }: { space: "trainee" | "trainer" }) {
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const [matches, peopleResult] = await Promise.all([
    getFaceoffMatches(space),
    db ? db.from("profiles").select("user_id,display_name,handle,role,is_verified")
      .eq("is_public", true).in("role", space === "trainer" ? ["coachsphere", "fitsphere"] : ["member"])
      .limit(100) : Promise.resolve({ data: [] }),
  ]);
  const events = new Map((await getFaceoffLiveEvents(matches.map((match) => match.id))).map((event) => [event.match_id, event]));
  const people = (peopleResult.data ?? []).filter((person) => person.user_id && person.user_id !== user?.id && (space !== "trainer" || person.is_verified))
    .map((person) => ({ user_id: person.user_id as string, display_name: person.display_name, handle: person.handle }));
  const names = new Map(people.map((person) => [person.user_id, person.display_name]));
  const ownProfile = user && db ? await db.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle() : null;
  if (user && ownProfile?.data) names.set(user.id, ownProfile.data.display_name);
  const available = matches.filter((match) => match.status === "open" && match.creator_user_id !== user?.id);
  const invitations = matches.filter((match) => match.status === "invited" && match.invitee_user_id === user?.id);
  const yours = matches.filter((match) => match.creator_user_id === user?.id || match.opponent_user_id === user?.id);
  const otherEvents = matches.filter((match) => match.status === "active" && match.live_enabled && !yours.some((own) => own.id === match.id));
  const basePath = space === "trainer" ? "/trainer" : "";
  return <div className="fc-page fc-faceoff-page">
    <PageHeader eyebrow="Face Off" title={space === "trainee" ? "Go head to head, live." : "Challenge each other to show up."} description={space === "trainee" ? "Set the rules and a digital title, invite an opponent, then compete live while your Circle watches and votes." : "Invite a person from your Circle or post an open challenge for someone to take."} />
    <div className="fc-faceoff-layout">
      <section className="fc-panel fc-faceoff-create"><h2><Swords size={21} aria-hidden /> Start a challenge</h2>
        {user && !user.is_anonymous ? <FaceoffCreateForm circleSpace={space} people={people} /> : <p>Sign in to create or accept a challenge. <Link href="/auth/login">Sign in</Link></p>}
        {space === "trainer" ? <LocalDataNote>Trainer Face Off tracks invitations and accepted goals. Progress and winners are not calculated.</LocalDataNote> : null}
      </section>
      <div className="fc-faceoff-lists">
        {invitations.length ? <section><h2>Invitations for you</h2><div className="fc-faceoff-cards">{invitations.map((match) => <FaceoffCard key={match.id} match={match} event={events.get(match.id)} name={names.get(match.creator_user_id) ?? "Member"} action="invite" />)}</div></section> : null}
        <section><h2>Find someone to challenge <span>{available.length}</span></h2>{available.length ? <div className="fc-faceoff-cards">{available.map((match) => <FaceoffCard key={match.id} match={match} event={events.get(match.id)} name={names.get(match.creator_user_id) ?? "Member"} action="open" />)}</div> : <p className="fc-faceoff-empty">No open challenges in your Circle yet. Start one above or invite someone directly.</p>}</section>
        {yours.length ? <section><h2>Your Face Offs</h2><div className="fc-faceoff-cards">{yours.map((match) => <FaceoffCard key={match.id} match={match} event={events.get(match.id)} name={names.get(match.creator_user_id) ?? "You"} action={match.creator_user_id === user?.id && ["open", "invited"].includes(match.status) ? "own" : "none"} />)}</div></section> : null}
        {space === "trainee" && otherEvents.length ? <section><h2>Live and scheduled</h2><div className="fc-faceoff-cards">{otherEvents.map((match) => <FaceoffCard key={match.id} match={match} event={events.get(match.id)} name={names.get(match.creator_user_id) ?? "Member"} action="none" />)}</div></section> : null}
        <Link className="fc-faceoff-more" href={basePath + "/discover?category=faceoff"}><UsersRound size={17} aria-hidden /> Search Face Offs and other people →</Link>
      </div>
    </div>
    {offline ? <LocalDataNote>Offline preview shows no saved Face Offs. Saving needs the local Supabase service.</LocalDataNote> : null}
  </div>;
}

function FaceoffCard({ match, event, name, action }: {
  match: Awaited<ReturnType<typeof getFaceoffMatches>>[number];
  event?: Awaited<ReturnType<typeof getFaceoffLiveEvents>>[number];
  name: string;
  action: "open" | "invite" | "own" | "none";
}) {
  return <article className="fc-faceoff-card">
    <div><StatusBadge tone={event?.state === "live" || match.status === "active" ? "accent" : "neutral"}>{event?.state === "live" ? "Live now" : match.status === "invited" ? "Invitation" : match.status}</StatusBadge><small>from {name}</small></div>
    <h3>{match.goal}</h3><p><CalendarDays size={15} aria-hidden /> {event ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.starts_at)) : "Aim for " + new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(match.target_date + "T12:00:00Z"))}</p>
    {event ? <><p>Winner’s title: {event.reward_title}</p>{!["cancelled", "declined"].includes(match.status) ? <Link className="fc-faceoff-more" href={`/faceoff/${match.id}`}><Radio size={16} aria-hidden /> {event.state === "live" ? "Watch live" : event.state === "completed" ? "View result" : match.status === "active" ? "View event" : "View rules"} →</Link> : null}</> : null}
    {action === "invite" ? <div className="fc-faceoff-actions"><FaceoffResponseForm matchId={match.id} decision="accept" /><FaceoffResponseForm matchId={match.id} decision="decline" /></div> : null}
    {action === "open" ? <FaceoffResponseForm matchId={match.id} decision="accept" /> : null}
    {action === "own" ? <FaceoffResponseForm matchId={match.id} decision="cancel" /> : null}
  </article>;
}
