"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { operatorSaveDiscoveryTag, saveBasicProfile, saveDiscoveryChoices } from "../profile-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };
function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button className="fc-button fc-button--primary" type="submit" disabled={pending || !available} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}{pending ? "Saving…" : children}</button>;
}
function Result({ state }: { state: ActionResult }) {
  return state.status === "idle" ? null : <p role={state.status === "error" ? "alert" : "status"} className={`fc-form-result fc-form-result--${state.status}`}>{state.message}</p>;
}
type Details = { first_name: string; last_name: string; phone: string; country: string; city: string } | null;
export function BasicProfileForm({ details }: { details: Details }) {
  const [state, action] = useActionState(saveBasicProfile, initial);
  return <form action={action} className="fc-form"><div className="fc-form-row"><label><span>First name</span><input name="firstName" defaultValue={details?.first_name ?? ""} maxLength={80} autoComplete="given-name" /></label><label><span>Surname</span><input name="lastName" defaultValue={details?.last_name ?? ""} maxLength={80} autoComplete="family-name" /></label></div><label><span>Phone (private)</span><input name="phone" type="tel" defaultValue={details?.phone ?? ""} maxLength={25} autoComplete="tel" /></label><div className="fc-form-row"><label><span>Country</span><input name="country" defaultValue={details?.country ?? ""} maxLength={80} autoComplete="country-name" /></label><label><span>City</span><input name="city" defaultValue={details?.city ?? ""} maxLength={80} autoComplete="address-level2" /></label></div><Submit>Save private details</Submit><Result state={state} /></form>;
}
type Tag = { id: string; kind: string; label: string; priority: number };
export function DiscoveryChoicesForm({ tags, selected }: { tags: Tag[]; selected: string[] }) {
  const [state, action] = useActionState(saveDiscoveryChoices, initial);
  const chosen = new Set(selected);
  return <form action={action} className="fc-form"><p>Selected topics move matching public results higher in Discover. Your choices stay private.</p>{["interest", "prompt"].map((kind) => <fieldset className="fc-choice-grid" key={kind}><legend>{kind === "interest" ? "Interests" : "Prompts"}</legend>{tags.filter((tag) => tag.kind === kind).map((tag) => <label key={tag.id}><input type="checkbox" name="tagId" value={tag.id} defaultChecked={chosen.has(tag.id)} /><span>{tag.label}</span></label>)}</fieldset>)}{tags.length ? <Submit>Save discovery choices</Submit> : <p>No choices have been published by an admin yet.</p>}<Result state={state} /></form>;
}
export function AdminDiscoveryTagForm({ tag }: { tag?: Tag & { is_active: boolean } }) {
  const [state, action] = useActionState(operatorSaveDiscoveryTag, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="id" value={tag?.id ?? ""} /><div className="fc-form-row"><label><span>Type</span><select name="kind" defaultValue={tag?.kind ?? "interest"}><option value="interest">Interest</option><option value="prompt">Prompt</option></select></label><label><span>Label</span><input name="label" defaultValue={tag?.label ?? ""} minLength={2} maxLength={80} required /></label><label><span>Priority</span><input name="priority" type="number" min={0} max={100} defaultValue={tag?.priority ?? 0} required /></label></div><label className="fc-check-label"><input type="checkbox" name="active" defaultChecked={tag?.is_active ?? true} /> Active</label><Submit>{tag ? "Save choice" : "Add choice"}</Submit><Result state={state} /></form>;
}
