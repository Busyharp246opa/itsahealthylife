"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Heart, LoaderCircle, MessageCircle } from "lucide-react";
import type { ActionResult } from "../actions";
import { addCircleComment, toggleCircleLike } from "../circle-actions";
import { useDataAvailable } from "./data-availability";

const initial: ActionResult = { status: "idle", message: "" };

function LikeButton({ liked, count }: { liked: boolean; count: number }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button type="submit" disabled={pending || !available} aria-pressed={liked} aria-busy={pending} aria-label={`${liked ? "Unlike" : "Like"} post, ${count} ${count === 1 ? "like" : "likes"}`} className="fc-post-like">{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : <Heart size={16} fill={liked ? "currentColor" : "none"} aria-hidden />} {liked ? "Liked" : "Like"}</button>;
}

export function CircleLikeForm({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  const [state, action] = useActionState(toggleCircleLike.bind(null, postId), initial);
  return <form action={action} className="fc-post-like-form"><LikeButton liked={liked} count={count} />{state.status === "error" ? <small role="alert">{state.message}</small> : null}</form>;
}

function CommentButton({ reply }: { reply: boolean }) {
  const { pending } = useFormStatus();
  const available = useDataAvailable();
  return <button type="submit" className="fc-button fc-button--quiet" disabled={pending || !available} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={16} aria-hidden /> : <MessageCircle size={16} aria-hidden />}{pending ? "Posting…" : reply ? "Reply" : "Comment"}</button>;
}

export function CircleCommentForm({ postId, parentCommentId, replyTo }: { postId: string; parentCommentId?: string; replyTo?: string }) {
  const [state, action] = useActionState(addCircleComment.bind(null, postId), initial);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state.status]);
  return <form ref={formRef} action={action} className="fc-post-comment-form"><input type="hidden" name="parentCommentId" value={parentCommentId ?? ""} /><label><span className="sr-only">{replyTo ? `Reply to ${replyTo}` : "Write a comment"}</span><textarea name="body" rows={2} maxLength={2000} required placeholder={replyTo ? `Reply to ${replyTo}…` : "Write a comment…"} /></label><CommentButton reply={!!parentCommentId} />{state.status !== "idle" ? <small role={state.status === "error" ? "alert" : "status"}>{state.message}</small> : null}</form>;
}
