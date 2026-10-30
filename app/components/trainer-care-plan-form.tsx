"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { saveTrainerClientPlan } from "../trainer-plan-actions";
import { useDataAvailable } from "./data-availability";

type Plan = { training_plan: string; diet_plan: string; recovery_plan: string; other_guidance: string } | null;
const initial: ActionResult = { status: "idle", message: "" };

function SaveButton() {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button className="fc-button fc-button--primary" type="submit" disabled={pending || !available} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}{pending ? "Saving…" : "Save client plan"}</button>;
}

export function TrainerCarePlanForm({ traineeId, plan }: { traineeId: string; plan: Plan }) {
  const [state, action] = useActionState(saveTrainerClientPlan.bind(null, traineeId), initial);
  return <form action={action} className="fc-form" id="care-plan">
    <p>Save guidance for this client. They will see each section in My plan. Their own workout and meal logs stay separate.</p>
    <label><span>Training plan</span><textarea name="trainingPlan" rows={6} maxLength={4000} defaultValue={plan?.training_plan ?? ""} placeholder="Weekly sessions, exercises, sets, progression, and rest days" /></label>
    <label><span>Diet plan</span><textarea name="dietPlan" rows={6} maxLength={4000} defaultValue={plan?.diet_plan ?? ""} placeholder="Food pattern, meals, hydration, and practical notes" /></label>
    <label><span>Recovery and wellness</span><textarea name="recoveryPlan" rows={5} maxLength={4000} defaultValue={plan?.recovery_plan ?? ""} placeholder="Recovery, sleep, and check-in guidance" /></label>
    <label><span>Other guidance</span><textarea name="otherGuidance" rows={4} maxLength={4000} defaultValue={plan?.other_guidance ?? ""} placeholder="Anything else the client should see" /></label>
    <SaveButton />
    {state.status !== "idle" ? <p role={state.status === "error" ? "alert" : "status"} className={`fc-form-result fc-form-result--${state.status}`}>{state.message}</p> : null}
  </form>;
}
