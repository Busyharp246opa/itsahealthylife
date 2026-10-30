"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { createSupportTicket, markLocalNotificationRead, operatorCreateChallenge, operatorCreateCommunity, operatorReplySupportTicket, operatorReviewPostReport, operatorSaveGuidelines, operatorSendLocalNotification, replySupportTicket, reportPost, setUserBlock } from "../flow-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button className="fc-button fc-button--primary" disabled={pending || !available} aria-busy={pending} type="submit">{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : null}{pending ? "Saving…" : children}</button>;
}
function Result({ state }: { state: ActionResult }) {
  return state.status === "idle" ? null : <p className={`fc-form-result fc-form-result--${state.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}{state.href ? <> <Link href={state.href}>Open ticket</Link></> : null}</p>;
}
export function SupportTicketForm() {
  const [state, action] = useActionState(createSupportTicket, initial);
  return <form action={action} className="fc-form"><label><span>Subject</span><input name="subject" minLength={4} maxLength={120} required /></label><label><span>Category</span><select name="category"><option value="account">Account</option><option value="community">Community</option><option value="training">Training</option><option value="other">Other</option></select></label><label><span>How can we help?</span><textarea name="body" rows={5} minLength={4} maxLength={4000} required /></label><Submit>Open ticket</Submit><Result state={state} /></form>;
}
export function SupportReplyForm({ ticketId, operator = false }: { ticketId: string; operator?: boolean }) {
  const [state, action] = useActionState(operator ? operatorReplySupportTicket : replySupportTicket, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="ticketId" value={ticketId} /><label><span>Reply</span><textarea name="body" rows={4} minLength={4} maxLength={4000} required /></label>{operator ? <label><span>Status</span><select name="status"><option value="in_review">In review</option><option value="open">Open</option><option value="resolved">Resolved</option></select></label> : null}<Submit>Send reply</Submit><Result state={state} /></form>;
}
export function GuidelinesForm({ body }: { body: string }) {
  const [state, action] = useActionState(operatorSaveGuidelines, initial);
  return <form action={action} className="fc-form"><label><span>Published guidelines</span><textarea name="body" rows={10} minLength={20} maxLength={10000} defaultValue={body} required /></label><Submit>Publish guidelines</Submit><Result state={state} /></form>;
}
export function ReportPostForm({ postId }: { postId: string }) {
  const [state, action] = useActionState(reportPost, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="postId" value={postId} /><label><span>Report reason</span><select name="reason"><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="unsafe">Unsafe advice</option><option value="other">Other</option></select></label><label><span>Detail (optional)</span><input name="detail" maxLength={1000} /></label><Submit>Report</Submit><Result state={state} /></form>;
}
export function BlockUserForm({ userId, blocked = false }: { userId: string; blocked?: boolean }) {
  const [state, action] = useActionState(setUserBlock, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="userId" value={userId} /><input type="hidden" name="intent" value={blocked ? "unblock" : "block"} /><Submit>{blocked ? "Unblock" : "Block"}</Submit><Result state={state} /></form>;
}
export function ReviewPostReportForm({ id }: { id: string }) {
  const [state, action] = useActionState(operatorReviewPostReport, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="id" value={id} /><label><span>Review result</span><select name="status"><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option></select></label><label><span>Post action</span><select name="postAction"><option value="keep">Keep visible</option><option value="hide">Hide from public feed</option></select></label><Submit>Save review</Submit><Result state={state} /></form>;
}
export function AdminChallengeForm() {
  const [state, action] = useActionState(operatorCreateChallenge, initial);
  return <form action={action} className="fc-form"><label><span>Name</span><input name="name" minLength={4} maxLength={100} required /></label><label><span>Rules and description</span><textarea name="description" minLength={10} maxLength={2000} rows={4} required /></label><div className="fc-form-row"><label><span>Metric</span><input name="metric" placeholder="e.g. sessions" minLength={2} maxLength={50} required /></label><label><span>Target</span><input name="target" type="number" min="0.01" max="1000000" step="0.01" required /></label><label><span>Unit</span><input name="unit" placeholder="e.g. sessions" maxLength={30} required /></label></div><div className="fc-form-row"><label><span>Starts</span><input name="startsOn" type="date" required /></label><label><span>Ends</span><input name="endsOn" type="date" required /></label></div><p>No coin reward is issued until reward rules are approved.</p><Submit>Publish challenge</Submit><Result state={state} /></form>;
}
export function AdminCommunityForm() {
  const [state, action] = useActionState(operatorCreateCommunity, initial);
  return <form action={action} className="fc-form"><label><span>Name</span><input name="name" minLength={3} maxLength={80} required /></label><label><span>Topic</span><input name="topic" minLength={2} maxLength={60} required /></label><label><span>Description</span><textarea name="description" rows={3} minLength={10} maxLength={1000} required /></label><p>New rooms are public until private membership rules are approved.</p><Submit>Create public community</Submit><Result state={state} /></form>;
}
export function AdminNotificationForm({ campaignId }: { campaignId: string }) {
  const [state, action] = useActionState(operatorSendLocalNotification, initial);
  return <form action={action} className="fc-form"><input type="hidden" name="campaignId" value={campaignId} /><label><span>Title</span><input name="title" minLength={4} maxLength={120} required /></label><label><span>Message</span><textarea name="body" rows={4} minLength={4} maxLength={2000} required /></label><p>Sends to local in-app inboxes only. Push delivery and scheduling are not connected.</p><Submit>Send to all local users</Submit><Result state={state} /></form>;
}
export function MarkNotificationReadForm({ id }: { id: string }) {
  const [state, action] = useActionState(markLocalNotificationRead, initial);
  return <form action={action} className="fc-inline-action"><input type="hidden" name="id" value={id} /><Submit>Mark read</Submit><Result state={state} /></form>;
}
