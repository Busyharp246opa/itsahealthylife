"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Swords } from "lucide-react";
import type { ActionResult } from "../actions";
import { createFaceoff, respondToFaceoff } from "../faceoff-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };

function ActionButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button className="fc-button fc-button--primary" type="submit" disabled={pending || !available} aria-busy={pending}>
    {pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : <Swords size={16} aria-hidden />}{children}
  </button>;
}

export function FaceoffCreateForm({ circleSpace, people }: {
  circleSpace: "trainee" | "trainer";
  people: Array<{ user_id: string; display_name: string; handle: string }>;
}) {
  const [state, action] = useActionState(createFaceoff, initial);
  const ref = useRef<HTMLFormElement>(null);
  const isoRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (state.status === "success") ref.current?.reset(); }, [state.status]);
  const minDate = new Date().toISOString().slice(0, 10);
  return <form ref={ref} action={action} className="fc-form fc-faceoff-form">
    <input type="hidden" name="circleSpace" value={circleSpace} />
    <label><span>Who will you challenge?</span><select name="inviteeId" defaultValue=""><option value="">Anyone in this Circle · open challenge</option>{people.map((person) => <option key={person.user_id} value={person.user_id}>{person.display_name} (@{person.handle})</option>)}</select></label>
    <label><span>The challenge</span><textarea name="goal" minLength={8} maxLength={240} rows={3} required placeholder={circleSpace === "trainee" ? "e.g. 15-minute bodyweight circuit" : "e.g. Complete three 30-minute walks this week"} /></label>
    {circleSpace === "trainee" ? <>
      <label><span>Live start, your local time</span><input name="startsAtLocal" type="datetime-local" required onChange={(event) => {
        const date = new Date(event.currentTarget.value);
        if (isoRef.current) isoRef.current.value = Number.isNaN(date.getTime()) ? "" : date.toISOString();
      }} /></label>
      <input ref={isoRef} name="startsAtIso" type="hidden" />
      <label><span>Competition length</span><select name="durationMinutes" defaultValue="15"><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>
      <label><span>Rules and how viewers should judge</span><textarea name="rules" minLength={12} maxLength={1200} rows={4} required placeholder="Describe the activity, what counts, and how to decide who wins." /></label>
      <label><span>Winner’s digital title</span><input name="rewardTitle" minLength={3} maxLength={80} required defaultValue="Face Off Champion" /></label>
      <p className="fc-faceoff-help">The winner receives this title on the result. Cash and physical prizes are not supported.</p>
    </> : <label><span>Target date</span><input name="targetDate" type="date" min={minDate} required /></label>}
    <ActionButton>Start Face Off</ActionButton>
    {state.status !== "idle" ? <p className={"fc-form-result fc-form-result--" + state.status} role={state.status === "error" ? "alert" : "status"}>{state.message}</p> : null}
  </form>;
}

export function FaceoffResponseForm({ matchId, decision }: { matchId: string; decision: "accept" | "decline" | "cancel" }) {
  const [state, action] = useActionState(respondToFaceoff.bind(null, matchId, decision), initial);
  return <form action={action} className="fc-faceoff-response">
    <ResponseButton decision={decision} />
    {state.status === "error" ? <small role="alert">{state.message}</small> : null}
  </form>;
}

function ResponseButton({ decision }: { decision: "accept" | "decline" | "cancel" }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button type="submit" className={"fc-button " + (decision === "accept" ? "fc-button--primary" : "fc-button--quiet")} disabled={pending || !available} aria-busy={pending}>{decision === "accept" ? "Accept challenge" : decision === "decline" ? "Decline" : "Cancel"}</button>;
}
