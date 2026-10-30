"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, Paperclip, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addMealItem,
  addWorkoutExercise,
  changeWorkoutStatus,
  copyWorkoutTemplate,
  createDataRequest,
  deleteMyAccount,
  createJournalEntry,
  createMeal,
  createPost,
  createWorkout,
  deleteJournalEntry,
  deleteMeal,
  deleteWorkout,
  joinChallenge,
  loadDemoHistory,
  operatorSetFeatureFlag,
  operatorUpdateCase,
  removeWorkoutExercise,
  removeMealItem,
  requestBooking,
  saveCheckin,
  saveWorkoutSet,
  sendMessage,
  updateConsent,
  updateNotificationPreferences,
  updateJournalEntry,
  updateMeal,
  updateMealItem,
  updateProfile,
  updateWorkout,
} from "../actions";
import type { ActionResult } from "../actions";
import type { Coach, Community, Profile } from "../../lib/fitcircle-data";
import { useDataAvailable } from "./data-availability";

const initialActionResult: ActionResult = { status: "idle", message: "" };

function SubmitButton({ children, className = "fc-button fc-button--primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const dataAvailable = useDataAvailable();
  return (
    <button type="submit" className={className} disabled={pending || !dataAvailable} title={!dataAvailable ? "Saving requires local Supabase" : undefined} data-state={pending ? "loading" : undefined}>
      {pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}
      {children}
    </button>
  );
}

function Result({ status, message, href }: ActionResult) {
  return <p className={`fc-form-result fc-form-result--${status}`} role={status === "error" ? "alert" : status === "success" ? "status" : undefined}>{status === "success" ? <Check size={15} aria-hidden /> : null}{message}{href ? <> <Link href={href}>Open details</Link></> : null}</p>;
}

export function PostForm({ communities, circleSpace = "trainee" }: { communities: Community[]; circleSpace?: "trainee" | "trainer" }) {
  const [state, action] = useActionState(createPost, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  return (
    <form ref={formRef} action={action} className="fc-form fc-compose-form">
      <input type="hidden" name="circleSpace" value={circleSpace} />
      <label><span>Title <small>optional</small></span><input name="title" placeholder="Name the training note" maxLength={120} /></label>
      <label><span>Post</span><textarea name="body" rows={4} placeholder="What did you learn, finish, or need help with?" required /></label>
      <div className="fc-form-row">
        {circleSpace === "trainee" ? <label><span>Audience</span><select name="communityId" defaultValue=""><option value="">Trainee Circle</option>{communities.map((community) => <option value={community.id} key={community.id}>{community.name}</option>)}</select></label> : <p>Visible to the Trainer Circle</p>}
        <SubmitButton>Publish note</SubmitButton>
      </div>
      <Result {...state} />
    </form>
  );
}

export function CopyWorkoutForm({ templateId }: { templateId: string }) {
  const [state, action] = useActionState(copyWorkoutTemplate, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="templateId" value={templateId} /><SubmitButton className="fc-button fc-button--quiet">Copy to drafts</SubmitButton><Result {...state} /></form>;
}

export function CreateWorkoutForm() {
  const [state, action] = useActionState(createWorkout, initialActionResult);
  return <form action={action} className="fc-form fc-create-workout"><label><span>Workout name</span><input name="name" required minLength={2} maxLength={80} placeholder="e.g. Friday full body" /></label><SubmitButton>Create private workout</SubmitButton><Result {...state} /></form>;
}

export function LoadDemoHistoryForm() {
  const [state, action] = useActionState(loadDemoHistory, initialActionResult);
  return <form action={action} className="fc-inline-action"><SubmitButton className="fc-button fc-button--quiet">Load synthetic sample history</SubmitButton><Result {...state} /></form>;
}

export function OperatorCaseForm({ targetId, status }: { targetId: string; status: string }) {
  const [state, action] = useActionState(operatorUpdateCase, initialActionResult);
  return <form action={action} className="fc-form fc-operator-form"><input type="hidden" name="targetId" value={targetId} /><label><span>Status</span><select name="nextStatus" defaultValue={status}><option value="open">Open</option><option value="review">In review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label><label><span>Review note</span><textarea name="note" rows={2} minLength={3} maxLength={1000} required /></label><SubmitButton className="fc-button fc-button--quiet">Save review</SubmitButton><Result {...state} /></form>;
}

export function OperatorFlagForm({ flagKey, enabled }: { flagKey: string; enabled: boolean }) {
  const [state, action] = useActionState(operatorSetFeatureFlag, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="flagKey" value={flagKey} /><input type="hidden" name="nextEnabled" value={String(!enabled)} /><SubmitButton className="fc-button fc-button--quiet">Turn {enabled ? "off" : "on"}</SubmitButton><Result {...state} /></form>;
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteMyAccount, initialActionResult);
  return <form action={action} className="fc-form fc-delete-account"><label><span>Type DELETE to confirm</span><input name="confirmation" autoComplete="off" required pattern="DELETE" /></label><SubmitButton className="fc-button fc-button--danger">Delete local account and private data</SubmitButton><Result {...state} />{state.status === "success" ? <button type="button" className="fc-button fc-button--quiet" onClick={() => window.location.assign("/today")}>Start a new local session</button> : null}</form>;
}

export function AddMovementForm({ exerciseId, drafts }: { exerciseId: string; drafts: Array<{ id: string; name: string }> }) {
  const [state, action] = useActionState(addWorkoutExercise, initialActionResult);
  if (!drafts.length) return <p className="fc-helper">Create a private draft from <Link href="/train/workouts">workouts</Link> before adding movements.</p>;
  return <form action={action} className="fc-form"><input type="hidden" name="exerciseId" value={exerciseId} /><label><span>Add to your draft</span><select name="workoutId" required>{drafts.map((draft) => <option value={draft.id} key={draft.id}>{draft.name}</option>)}</select></label><SubmitButton>Add movement</SubmitButton><Result {...state} /></form>;
}

export function WorkoutDetailsForm({ workout }: { workout: { id: string; name: string; notes: string } }) {
  const [state, action] = useActionState(updateWorkout, initialActionResult);
  return <form action={action} className="fc-form"><input type="hidden" name="workoutId" value={workout.id} /><label><span>Name</span><input name="name" defaultValue={workout.name} minLength={2} maxLength={80} required /></label><label><span>Session notes</span><textarea name="notes" defaultValue={workout.notes} maxLength={1000} rows={3} /></label><SubmitButton>Save draft</SubmitButton><Result {...state} /></form>;
}

export function WorkoutStatusForm({ workoutId, intent, children }: { workoutId: string; intent: "start" | "complete" | "reopen"; children: React.ReactNode }) {
  const [state, action] = useActionState(changeWorkoutStatus, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="workoutId" value={workoutId} /><input type="hidden" name="intent" value={intent} /><SubmitButton>{children}</SubmitButton><Result {...state} /></form>;
}

export function WorkoutSetForm({ workoutId, workoutExerciseId, setNumber, current }: { workoutId: string; workoutExerciseId: string; setNumber: number; current?: { weight_kg: number | null; reps: number | null; rpe: number | null; is_warmup: boolean } }) {
  const [state, action] = useActionState(saveWorkoutSet, initialActionResult);
  return <form action={action} className="fc-set-form"><input type="hidden" name="workoutId" value={workoutId} /><input type="hidden" name="workoutExerciseId" value={workoutExerciseId} /><input type="hidden" name="setNumber" value={setNumber} /><strong>Set {setNumber}</strong><label><span>kg</span><input name="weightKg" type="number" min="0" max="999" step="0.25" defaultValue={current?.weight_kg ?? 0} required /></label><label><span>Reps</span><input name="reps" type="number" min="0" max="100" step="1" defaultValue={current?.reps ?? ""} required /></label><label><span>RPE</span><input name="rpe" type="number" min="0" max="10" step="0.5" defaultValue={current?.rpe ?? ""} /></label><label className="fc-set-warmup"><input name="isWarmup" type="checkbox" defaultChecked={current?.is_warmup ?? false} /><span>Warm-up</span></label><SubmitButton className="fc-button fc-button--quiet">{current ? "Update" : "Log set"}</SubmitButton><Result {...state} /></form>;
}

export function RemoveMovementForm({ workoutId, workoutExerciseId }: { workoutId: string; workoutExerciseId: string }) {
  const [state, action] = useActionState(removeWorkoutExercise, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="workoutId" value={workoutId} /><input type="hidden" name="workoutExerciseId" value={workoutExerciseId} /><SubmitButton className="fc-button fc-button--quiet">Remove</SubmitButton><Result {...state} /></form>;
}

export function DeleteWorkoutForm({ workoutId }: { workoutId: string }) {
  const [state, action] = useActionState(deleteWorkout, initialActionResult);
  return <form action={action} className="fc-form fc-delete-record"><input type="hidden" name="workoutId" value={workoutId} /><label><span>Type DELETE to remove this workout and its sets</span><input name="confirmation" pattern="DELETE" required autoComplete="off" /></label><SubmitButton className="fc-button fc-button--danger">Delete workout</SubmitButton><Result {...state} /></form>;
}

export function CheckinForm() {
  const [state, action] = useActionState(saveCheckin, initialActionResult);
  return (
    <form action={action} className="fc-form fc-checkin-form">
      <div className="fc-range-grid">
        <label><span>Mood</span><input name="mood" type="range" min="1" max="5" defaultValue="4" /><small>Low to steady</small></label>
        <label><span>Energy</span><input name="energy" type="range" min="1" max="5" defaultValue="3" /><small>Empty to ready</small></label>
        <label><span>Soreness</span><input name="soreness" type="range" min="1" max="5" defaultValue="2" /><small>Fresh to high</small></label>
      </div>
      <label><span>Sleep</span><input name="sleepHours" type="number" min="0" max="24" step="0.5" defaultValue="7.5" /></label>
      <label><span>Private note <small>optional</small></span><textarea name="note" rows={3} placeholder="Anything that should change today’s plan?" /></label>
      <SubmitButton>Save private check-in</SubmitButton>
      <Result {...state} />
    </form>
  );
}

function FoodFields() {
  return <div className="fc-food-fields"><label><span>Food</span><input name="name" required minLength={2} maxLength={120} placeholder="e.g. Greek yogurt" /></label><label><span>Amount</span><input name="quantity" type="number" min="0.01" max="10000" step="0.01" defaultValue="1" required /></label><label><span>Unit</span><input name="unit" maxLength={32} defaultValue="serving" required /></label><label><span>Calories</span><input name="calories" type="number" min="0" max="10000" step="1" required /></label><label><span>Protein (g)</span><input name="proteinG" type="number" min="0" max="10000" step="0.1" required /></label><label><span>Carbs (g)</span><input name="carbsG" type="number" min="0" max="10000" step="0.1" required /></label><label><span>Fat (g)</span><input name="fatG" type="number" min="0" max="10000" step="0.1" required /></label></div>;
}

export function CreateMealForm() {
  const [state, action] = useActionState(createMeal, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  return <form ref={formRef} action={action} className="fc-form"><label><span>Meal</span><select name="mealType"><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><FoodFields /><label><span>Notes (optional)</span><textarea name="notes" rows={2} maxLength={500} /></label><p className="fc-helper">Enter values for the amount you actually ate. Use food packaging or a trusted nutrient database; this form does not estimate nutrients.</p><SubmitButton>Log meal</SubmitButton><Result {...state} /></form>;
}

export function AddMealItemForm({ mealId }: { mealId: string }) {
  const [state, action] = useActionState(addMealItem, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  return <form ref={formRef} action={action} className="fc-form"><input type="hidden" name="mealId" value={mealId} /><FoodFields /><SubmitButton>Add food</SubmitButton><Result {...state} /></form>;
}

export function RemoveMealItemForm({ mealId, itemId }: { mealId: string; itemId: string }) {
  const [state, action] = useActionState(removeMealItem, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="mealId" value={mealId} /><input type="hidden" name="itemId" value={itemId} /><SubmitButton className="fc-button fc-button--quiet">Remove</SubmitButton><Result {...state} /></form>;
}

export function UpdateMealItemForm({ mealId, item }: { mealId: string; item: { id: string; name: string; quantity: number; unit: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null } }) {
  const [state, action] = useActionState(updateMealItem, initialActionResult);
  return <details className="fc-edit-food"><summary>Edit food values</summary><form action={action} className="fc-form"><input type="hidden" name="mealId" value={mealId} /><input type="hidden" name="itemId" value={item.id} /><div className="fc-food-fields"><label><span>Food</span><input name="name" defaultValue={item.name} required minLength={2} maxLength={120} /></label><label><span>Amount</span><input name="quantity" type="number" min="0.01" max="10000" step="0.01" defaultValue={item.quantity} required /></label><label><span>Unit</span><input name="unit" defaultValue={item.unit} maxLength={32} required /></label><label><span>Calories</span><input name="calories" type="number" min="0" max="10000" defaultValue={item.calories ?? 0} required /></label><label><span>Protein (g)</span><input name="proteinG" type="number" min="0" max="10000" step="0.1" defaultValue={item.protein_g ?? 0} required /></label><label><span>Carbs (g)</span><input name="carbsG" type="number" min="0" max="10000" step="0.1" defaultValue={item.carbs_g ?? 0} required /></label><label><span>Fat (g)</span><input name="fatG" type="number" min="0" max="10000" step="0.1" defaultValue={item.fat_g ?? 0} required /></label></div><SubmitButton className="fc-button fc-button--quiet">Save food</SubmitButton><Result {...state} /></form></details>;
}

export function UpdateMealForm({ meal }: { meal: { id: string; meal_type: string; notes: string } }) {
  const [state, action] = useActionState(updateMeal, initialActionResult);
  return <form action={action} className="fc-form"><input type="hidden" name="mealId" value={meal.id} /><label><span>Meal type</span><select name="mealType" defaultValue={meal.meal_type}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label><span>Notes</span><textarea name="notes" defaultValue={meal.notes} rows={2} maxLength={500} /></label><SubmitButton className="fc-button fc-button--quiet">Save meal details</SubmitButton><Result {...state} /></form>;
}

export function DeleteMealForm({ mealId }: { mealId: string }) {
  const [state, action] = useActionState(deleteMeal, initialActionResult);
  return <form action={action} className="fc-form fc-delete-record"><input type="hidden" name="mealId" value={mealId} /><label><span>Type DELETE to remove this meal and its foods</span><input name="confirmation" pattern="DELETE" required autoComplete="off" /></label><SubmitButton className="fc-button fc-button--danger">Delete meal</SubmitButton><Result {...state} /></form>;
}

export function JournalForm() {
  const [state, action] = useActionState(createJournalEntry, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  return <form ref={formRef} action={action} className="fc-form"><label><span>Title (optional)</span><input name="title" maxLength={120} placeholder="What is on your mind?" /></label><label><span>Private reflection</span><textarea name="body" minLength={2} maxLength={5000} rows={5} required /></label><SubmitButton>Save private reflection</SubmitButton><Result {...state} /></form>;
}

export function UpdateJournalForm({ entry }: { entry: { id: string; title: string; body: string } }) {
  const [state, action] = useActionState(updateJournalEntry, initialActionResult);
  return <details className="fc-edit-journal"><summary>Edit reflection</summary><form action={action} className="fc-form"><input type="hidden" name="entryId" value={entry.id} /><label><span>Title</span><input name="title" defaultValue={entry.title} maxLength={120} /></label><label><span>Reflection</span><textarea name="body" defaultValue={entry.body} minLength={2} maxLength={5000} rows={4} required /></label><SubmitButton className="fc-button fc-button--quiet">Save reflection</SubmitButton><Result {...state} /></form></details>;
}

export function DeleteJournalForm({ entryId }: { entryId: string }) {
  const [state, action] = useActionState(deleteJournalEntry, initialActionResult);
  return <details className="fc-edit-journal"><summary>Remove reflection</summary><form action={action} className="fc-inline-action"><input type="hidden" name="entryId" value={entryId} /><SubmitButton className="fc-button fc-button--quiet">Confirm removal</SubmitButton><Result {...state} /></form></details>;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfile, initialActionResult);
  return <form action={action} className="fc-form"><label><span>Display name</span><input name="displayName" defaultValue={profile.display_name} minLength={2} maxLength={80} required /></label><label><span>Handle</span><input name="handle" defaultValue={profile.handle} minLength={3} maxLength={32} pattern="[a-z0-9_]+" required /></label><label><span>Headline</span><input name="headline" defaultValue={profile.headline} maxLength={160} /></label><label><span>Location</span><input name="location" defaultValue={profile.location} maxLength={120} /></label><label><span>Bio</span><textarea name="bio" defaultValue={profile.bio} maxLength={1000} rows={4} /></label><label className="fc-checkbox-row"><input name="isPublic" type="checkbox" defaultChecked={profile.is_public ?? false} /><span>Show this profile publicly</span></label><SubmitButton>Save profile</SubmitButton><Result {...state} /></form>;
}

export function NotificationPreferencesForm({ preferences }: { preferences: { reminder_day: boolean; reminder_hour: boolean; reminder_ten_minutes: boolean; weekly_digest: boolean } }) {
  const [state, action] = useActionState(updateNotificationPreferences, initialActionResult);
  const options = [{ name: "reminderDay", label: "24 hours before", checked: preferences.reminder_day }, { name: "reminderHour", label: "1 hour before", checked: preferences.reminder_hour }, { name: "reminderTenMinutes", label: "10 minutes before", checked: preferences.reminder_ten_minutes }, { name: "weeklyDigest", label: "Weekly training digest", checked: preferences.weekly_digest }];
  return <form action={action} className="fc-form"><div className="fc-setting-list">{options.map((option) => <label className="fc-setting-row" key={option.name}><span><strong>{option.label}</strong><small>Saved to your local account</small></span><input type="checkbox" name={option.name} defaultChecked={option.checked} /></label>)}</div><p className="fc-helper">Preferences are stored now; actual delivery remains disabled until a notification provider is connected.</p><SubmitButton>Save preferences</SubmitButton><Result {...state} /></form>;
}

export function BookingForm({ coach }: { coach: Coach }) {
  const [state, action] = useActionState(requestBooking, initialActionResult);
  return (
    <form action={action} className="fc-form">
      <input type="hidden" name="coachId" value={coach.id} />
      <label><span>Available time</span><select name="slotId" required defaultValue=""><option value="" disabled>Choose a slot</option>{coach.coach_availability.map((slot) => <option key={slot.id} value={slot.id}>{new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short", timeZone: slot.timezone }).format(new Date(slot.starts_at))}</option>)}</select></label>
      <label><span>Package</span><select name="packageId" defaultValue=""><option value="">Single session · {coach.currency} {coach.base_price}</option>{coach.coach_packages.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.currency} {item.price}</option>)}</select></label>
      <label><span>Coach note <small>optional</small></span><textarea name="note" rows={3} placeholder="What should the coach know?" /></label>
      <p className="fc-helper">This creates a local request only. No coach is contacted and no money moves.</p>
      <SubmitButton>Request session</SubmitButton>
      <Result {...state} />
    </form>
  );
}

export function ChallengeJoinForm({ challengeId }: { challengeId: string }) {
  const [state, action] = useActionState(joinChallenge, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="challengeId" value={challengeId} /><SubmitButton className="fc-button fc-button--quiet">Join locally</SubmitButton><Result {...state} /></form>;
}

function MessageSubmitButton({ uploading }: { uploading: boolean }) {
  const { pending } = useFormStatus();
  const dataAvailable = useDataAvailable();
  return <button type="submit" className="fc-icon-submit" disabled={uploading || pending || !dataAvailable} aria-label="Send message">{uploading || pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : <Send size={17} aria-hidden />}</button>;
}

export function MessageForm({ conversationId }: { conversationId: string }) {
  const [state, action] = useActionState(sendMessage, initialActionResult);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const router = useRouter();
  const dataAvailable = useDataAvailable();
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  async function submitAttachment(event: React.FormEvent<HTMLFormElement>) {
    if (!file) return;
    event.preventDefault();
    if (!dataAvailable || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const payload = new FormData(event.currentTarget);
      payload.set("file", file);
      const response = await fetch("/api/messages/attachments", { method: "POST", body: payload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not send attachment.");
      formRef.current?.reset();
      setFile(null);
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not send attachment.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <form ref={formRef} action={action} onSubmit={submitAttachment} className="fc-message-form">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input ref={fileRef} hidden type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => {
        const selected = event.target.files?.[0] ?? null;
        if (selected && (selected.size > 10 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(selected.type))) {
          setFile(null);
          setUploadError("Choose a JPG, PNG, WebP, or PDF under 10 MB.");
          event.target.value = "";
          return;
        }
        setFile(selected);
        setUploadError("");
      }} aria-label="Choose attachment" />
      <button type="button" className="fc-attach-button" onClick={() => fileRef.current?.click()} aria-label="Add attachment" title="Attach a JPG, PNG, WebP, or PDF under 10 MB"><Paperclip size={19} aria-hidden /></button>
      <label className="fc-sr-only" htmlFor="message-body">Message</label>
      <input id="message-body" name="body" placeholder="Write a message" autoComplete="off" maxLength={4000} required={!file} />
      <MessageSubmitButton uploading={uploading} />
      {file ? <div className="fc-attachment-selection"><Paperclip size={15} aria-hidden /><span>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</span><button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Remove attachment"><X size={15} aria-hidden /></button></div> : null}
      {uploadError ? <p className="fc-form-result fc-form-result--error" role="alert">{uploadError}</p> : null}
      {state.status !== "idle" ? <Result {...state} /> : null}
    </form>
  );
}

export function ConsentForm({ scope, granted, title, detail }: { scope: "wellness_personalization" | "coach_readiness" | "marketing" | "research"; granted: boolean; title: string; detail: string }) {
  const [state, action] = useActionState(updateConsent, initialActionResult);
  return (
    <form action={action} className="fc-setting-row">
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="granted" value={String(!granted)} />
      <span><strong>{title}</strong><small>{detail}</small><Result {...state} /></span>
      <SubmitButton className={`fc-switch ${granted ? "is-on" : ""}`}><span aria-hidden /> <span className="fc-sr-only">{granted ? "Revoke" : "Grant"} {title}</span></SubmitButton>
    </form>
  );
}

export function DataRequestForm({ requestType, children, danger = false }: { requestType: "export" | "delete" | "correct"; children: React.ReactNode; danger?: boolean }) {
  const [state, action] = useActionState(createDataRequest, initialActionResult);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="requestType" value={requestType} /><SubmitButton className={`fc-button ${danger ? "fc-button--danger" : "fc-button--quiet"}`}>{children}</SubmitButton><Result {...state} /></form>;
}
