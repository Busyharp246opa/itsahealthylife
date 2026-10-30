"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { applyReferralCode, createReferralCode, operatorAwardBadge, operatorCreateBadge, operatorCreateSpotlight, operatorEndSpotlight } from "../engagement-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };
function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button type="submit" className="fc-button fc-button--primary" disabled={pending || !available} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}{pending ? "Saving…" : children}</button>;
}
function Result({ state }: { state: ActionResult }) {
  return state.status === "idle" ? null : <p role={state.status === "error" ? "alert" : "status"} className={`fc-form-result fc-form-result--${state.status}`}>{state.message}</p>;
}

export function AdminBadgeForm() {
  const [state, action] = useActionState(operatorCreateBadge, initial);
  return <form action={action} className="fc-form"><label><span>Badge title</span><input name="title" minLength={3} maxLength={80} required /></label><label><span>Description</span><textarea name="description" rows={3} minLength={10} maxLength={1000} required /></label><label><span>Tier</span><select name="tier"><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="gold">Gold</option></select></label><p>The Healthy Life symbol is used until badge artwork upload is specified.</p><Submit>Create badge</Submit><Result state={state} /></form>;
}
export function AdminBadgeAwardForm({ badges, members }: { badges: { id: string; title: string }[]; members: { id: string; name: string }[] }) {
  const [state, action] = useActionState(operatorAwardBadge, initial);
  return <form action={action} className="fc-form"><label><span>Badge</span><select name="badgeId" required>{badges.map((badge) => <option key={badge.id} value={badge.id}>{badge.title}</option>)}</select></label><label><span>Member</span><select name="userId" required>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label><span>Award note (optional)</span><input name="note" maxLength={500} /></label><Submit>Award once</Submit><Result state={state} /></form>;
}
export function AdminSpotlightForm({ coaches }: { coaches: { id: string; name: string }[] }) {
  const [state, action] = useActionState(operatorCreateSpotlight, initial);
  return <form action={action} className="fc-form"><label><span>Verified coach</span><select name="coachId" required>{coaches.map((coach) => <option key={coach.id} value={coach.id}>{coach.name}</option>)}</select></label><label><span>Banner title</span><input name="title" minLength={4} maxLength={120} required /></label><div className="fc-form-row"><label><span>Starts</span><input name="startsOn" type="date" required /></label><label><span>Ends</span><input name="endsOn" type="date" required /></label></div><Submit>Schedule spotlight</Submit><Result state={state} /></form>;
}
export function EndSpotlightForm({ id }: { id: string }) {
  const [state, action] = useActionState(operatorEndSpotlight, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="id" value={id} /><Submit>End spotlight</Submit><Result state={state} /></form>;
}
export function CreateReferralCodeForm() {
  const [state, action] = useActionState(createReferralCode, initial);
  return <form action={action} className="fc-inline-action"><Submit>Create my code</Submit><Result state={state} /></form>;
}
export function ApplyReferralCodeForm() {
  const [state, action] = useActionState(applyReferralCode, initial);
  return <form action={action} className="fc-form"><label><span>Referral code</span><input name="code" minLength={12} maxLength={12} pattern="FC[A-Za-z0-9]{10}" autoCapitalize="characters" required /></label><Submit>Record referral</Submit><Result state={state} /></form>;
}
