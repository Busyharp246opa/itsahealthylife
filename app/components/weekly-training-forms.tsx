"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { addCatalogMovement, addCustomMovement, copyStarterProgram, createTrainingSchedule, createWeeklyProgram, deleteTrainingSchedule, deleteWeeklyProgram, removeProgramMovement, saveProgramDay, saveProgramMovement, saveWeeklyProgram, selectTrainingSchedule, toggleScheduleShare } from "../weekly-training-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };

function Submit({ children, quiet = false }: { children: React.ReactNode; quiet?: boolean }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button type="submit" className={`fc-button ${quiet ? "fc-button--quiet" : "fc-button--primary"}`} disabled={pending || !available} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}{pending ? "Saving…" : children}</button>;
}
function Feedback({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  return <p className={`fc-training-feedback is-${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message} {state.href ? <Link href={state.href}>Open it →</Link> : null}</p>;
}

export function CreateWeeklyProgramForm() {
  const [state, action] = useActionState(createWeeklyProgram, initial);
  return <form action={action} className="fc-form"><label><span>Program name</span><input name="title" placeholder="e.g. My balanced week" minLength={2} maxLength={80} required /></label><label><span>What is this week for? <small>Optional</small></span><textarea name="description" rows={2} maxLength={500} placeholder="Build strength on three days and leave room for recovery." /></label><Submit>Create seven-day program</Submit><Feedback state={state} /></form>;
}

export function CopyStarterProgramForm({ sourceId }: { sourceId: string }) {
  const [state, action] = useActionState(copyStarterProgram, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="sourceId" value={sourceId} /><Submit quiet>Use as my program</Submit><Feedback state={state} /></form>;
}

export function WeeklyProgramDetailsForm({ program }: { program: { id: string; title: string; description: string } }) {
  const [state, action] = useActionState(saveWeeklyProgram, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="programId" value={program.id} /><label><span>Program name</span><input name="title" defaultValue={program.title} minLength={2} maxLength={80} required /></label><label><span>Program note</span><textarea name="description" defaultValue={program.description} rows={2} maxLength={500} /></label><Submit quiet>Save program details</Submit><Feedback state={state} /></form>;
}

export function DeleteWeeklyProgramForm({ programId }: { programId: string }) {
  const [state, action] = useActionState(deleteWeeklyProgram, initial);
  return <form action={action} className="fc-training-delete"><input type="hidden" name="programId" value={programId} /><label><span>Type DELETE to remove</span><input name="confirmation" pattern="DELETE" required autoComplete="off" /></label><Submit quiet>Delete program</Submit><Feedback state={state} /></form>;
}

export function ProgramDayForm({ programId, dayId, label }: { programId: string; dayId: string; label: string }) {
  const [state, action] = useActionState(saveProgramDay, initial);
  return <form action={action} className="fc-training-day-form"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><label><span className="sr-only">Day name</span><input name="label" defaultValue={label} minLength={2} maxLength={60} aria-label="Day name" /></label><Submit quiet>Save day</Submit><Feedback state={state} /></form>;
}

export function AddCatalogMovementForm({ programId, dayId, exerciseId }: { programId: string; dayId: string; exerciseId: string }) {
  const [state, action] = useActionState(addCatalogMovement, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><input type="hidden" name="exerciseId" value={exerciseId} /><Submit quiet>Add to day</Submit><Feedback state={state} /></form>;
}

export function AddCustomMovementForm({ programId, dayId }: { programId: string; dayId: string }) {
  const [state, action] = useActionState(addCustomMovement, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><label><span>Exercise name</span><input name="name" minLength={2} maxLength={100} required placeholder="e.g. Stair intervals" /></label><div className="fc-training-form-pair"><label><span>Target <small>Optional</small></span><input name="target" maxLength={80} placeholder="e.g. Cardio" /></label><label><span>Equipment <small>Optional</small></span><input name="equipment" maxLength={80} placeholder="e.g. Stairs" /></label></div><label><span>Your technique notes <small>Optional</small></span><textarea name="instructions" maxLength={1000} rows={3} placeholder="How you do this exercise safely and consistently" /></label><Submit>Save and add exercise</Submit><Feedback state={state} /></form>;
}

export function ReuseCustomMovementForm({ programId, dayId, exercises }: { programId: string; dayId: string; exercises: Array<{ id: string; name: string }> }) {
  const [state, action] = useActionState(addCustomMovement, initial);
  if (!exercises.length) return null;
  return <form action={action} className="fc-form"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><label><span>Your saved exercises</span><select name="existingId" required defaultValue=""><option value="" disabled>Choose an exercise</option>{exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select></label><Submit quiet>Add saved exercise</Submit><Feedback state={state} /></form>;
}

export function MovementTargetsForm({ programId, dayId, movement }: { programId: string; dayId: string; movement: { id: string; target_sets: number; target_reps: string; notes: string } }) {
  const [state, action] = useActionState(saveProgramMovement, initial);
  return <form action={action} className="fc-training-targets"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><input type="hidden" name="movementId" value={movement.id} /><label><span>Sets</span><input name="sets" type="number" min={1} max={12} defaultValue={movement.target_sets} required /></label><label><span>Reps / time</span><input name="reps" defaultValue={movement.target_reps} maxLength={30} required /></label><label className="fc-training-targets-note"><span>Notes</span><input name="notes" defaultValue={movement.notes} maxLength={500} placeholder="Optional cues" /></label><Submit quiet>Save targets</Submit><Feedback state={state} /></form>;
}

export function RemoveProgramMovementForm({ programId, dayId, movementId }: { programId: string; dayId: string; movementId: string }) {
  const [state, action] = useActionState(removeProgramMovement, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="programId" value={programId} /><input type="hidden" name="dayId" value={dayId} /><input type="hidden" name="movementId" value={movementId} /><Submit quiet>Remove</Submit><Feedback state={state} /></form>;
}

export function CreateTrainingScheduleForm({ programs, today }: { programs: Array<{ id: string; title: string }>; today: string }) {
  const [state, action] = useActionState(createTrainingSchedule, initial);
  return <form action={action} className="fc-form"><label><span>Schedule name</span><input name="title" minLength={2} maxLength={80} required placeholder="e.g. October training block" /></label><label><span>Program to follow</span><select name="programId" required defaultValue=""><option value="" disabled>Choose your program</option>{programs.map((program) => <option value={program.id} key={program.id}>{program.title}</option>)}</select></label><label><span>Start date</span><input name="startsOn" type="date" defaultValue={today} required /></label><p className="fc-helper">The selected program repeats every week from this date. Creating a schedule makes it the one you follow.</p><Submit>Create and follow schedule</Submit><Feedback state={state} /></form>;
}

export function SelectTrainingScheduleForm({ scheduleId }: { scheduleId: string }) {
  const [state, action] = useActionState(selectTrainingSchedule, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="scheduleId" value={scheduleId} /><Submit quiet>Follow this schedule</Submit><Feedback state={state} /></form>;
}

export function ToggleScheduleShareForm({ scheduleId, shared }: { scheduleId: string; shared: boolean }) {
  const [state, action] = useActionState(toggleScheduleShare, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="scheduleId" value={scheduleId} /><Submit quiet>{shared ? "Turn off link" : "Enable share link"}</Submit><Feedback state={state} /></form>;
}

export function CopyScheduleLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="fc-button fc-button--quiet" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/calendar/shared/${token}`); setCopied(true); }}>{copied ? "Copied" : "Copy link"}</button>;
}

export function DeleteTrainingScheduleForm({ scheduleId }: { scheduleId: string }) {
  const [state, action] = useActionState(deleteTrainingSchedule, initial);
  return <form action={action} className="fc-training-delete"><input type="hidden" name="scheduleId" value={scheduleId} /><label><span>Type DELETE to remove</span><input name="confirmation" pattern="DELETE" required autoComplete="off" /></label><Submit quiet>Delete schedule</Submit><Feedback state={state} /></form>;
}
