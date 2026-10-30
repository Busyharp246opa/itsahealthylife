"use client";
/* eslint-disable @next/next/no-img-element -- Private post media uses an authenticated same-origin route; the demo image is a local asset. */

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, MessageCircle, MoreHorizontal, Search, Share2 } from "lucide-react";
import type { Post } from "../../lib/fitcircle-data";
import { BlockUserForm, ReportPostForm } from "./flow-forms";
import { CircleCommentForm, CircleLikeForm } from "./circle-social-forms";
import { Avatar } from "./workspace-ui";

type Comment = NonNullable<Post["comments"]>[number];

function coachLabel(role?: string) {
  if (role === "fitsphere") return "Fitsphere coach";
  if (role === "coachsphere") return "Coachsphere coach";
  return "Community member";
}

function SharePostButton({ post, home }: { post: Post; home: boolean }) {
  const [message, setMessage] = useState("");

  async function share() {
    const coach = post.profiles?.role === "coachsphere" ? "coachsphere" : "fitsphere";
    const path = home ? `/trainee?coach=${coach}` : window.location.pathname + window.location.search;
    const url = `${window.location.origin}${path}#post-${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.title || `${post.profiles?.display_name ?? "Healthy Life"} on Healthy Life`, text: post.body.slice(0, 180), url });
        setMessage("Shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied.");
      } else {
        setMessage("Sharing is unavailable on this device.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Could not share this post. Try again.");
    }
  }

  return <span className="fc-post-share"><button type="button" onClick={share} aria-label={`Share post by ${post.profiles?.display_name ?? "Healthy Life"}`}><Share2 size={17} aria-hidden /> Share</button>{message ? <small role="status">{message}</small> : null}</span>;
}

function CommentThread({ postId, comment, replies, canInteract }: { postId: string; comment: Comment; replies: Comment[]; canInteract: boolean }) {
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const name = comment.profiles?.display_name ?? "Member";
  return <div className="fc-post-thread">
    <div className="fc-post-comment"><Avatar name={name} handle={comment.profiles?.handle} tone={comment.profiles?.avatar_tone} size="sm" /><div><strong>{name}</strong><p>{comment.body}</p>{canInteract ? <button type="button" onClick={() => setReplyTo(replyTo === name ? null : name)}>Reply</button> : null}</div></div>
    {replies.length ? <div className="fc-post-replies">{replies.map((reply) => <div className="fc-post-comment" key={reply.id}><Avatar name={reply.profiles?.display_name} handle={reply.profiles?.handle} tone={reply.profiles?.avatar_tone} size="sm" /><div><strong>{reply.profiles?.display_name ?? "Member"}</strong><p>{reply.body}</p>{canInteract ? <button type="button" onClick={() => setReplyTo(reply.profiles?.display_name ?? "Member")}>Reply</button> : null}</div></div>)}</div> : null}
    {replyTo ? <div className="fc-post-reply-form"><button type="button" className="fc-post-reply-cancel" onClick={() => setReplyTo(null)}>Cancel</button><CircleCommentForm postId={postId} parentCommentId={comment.id} replyTo={replyTo} /></div> : null}
  </div>;
}

function PostCard({ post, viewerId, canReport, home }: { post: Post; viewerId: string | null; canReport: boolean; home: boolean }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const comments = post.comments ?? [];
  const roots = comments.filter((comment) => !comment.parent_comment_id);
  const author = post.profiles;
  const authorName = author?.display_name ?? "Healthy Life";
  const mediaSrc = post.media_path ? `/api/posts/${post.id}/media` : post.demo_media_url;
  const mediaAlt = post.demo_media_url ? "Illustrative gym scene for a fictional sample post" : post.media_alt || "Post photo";
  const date = new Intl.DateTimeFormat("en-AE", { month: "short", day: "numeric" }).format(new Date(post.created_at));

  return <article className="fc-post" id={`post-${post.id}`}>
    <header className="fc-post-header">
      <div className="fc-post-author">{author?.handle ? <Link href={`/people/${author.handle}`}><Avatar name={authorName} handle={author.handle} tone={author.avatar_tone} /><span><strong>{authorName}{author.is_verified ? <BadgeCheck size={14} aria-label="Verified profile" /> : null}</strong><small>@{author.handle} · {date}</small></span></Link> : <div><Avatar name={authorName} /><span><strong>{authorName}</strong><small>{date}</small></span></div>}</div>
      {canReport && viewerId !== post.author_user_id ? <details className="fc-post-safety"><summary aria-label="Post options"><MoreHorizontal size={20} aria-hidden /></summary><div><ReportPostForm postId={post.id} />{post.author_user_id ? <BlockUserForm userId={post.author_user_id} /> : null}</div></details> : null}
    </header>
    <div className="fc-post-meta"><span className={`fc-post-source fc-post-source--${author?.role ?? "member"}`}>{coachLabel(author?.role)}</span>{post.communities?.name ? <span>{post.communities.name}</span> : null}</div>
    {post.title ? <h2>{post.title}</h2> : null}
    {post.body ? <p className="fc-post-body">{post.body}</p> : null}
    {mediaSrc ? <div className="fc-post-media">{post.media_path && post.media_type?.startsWith("video/") ? <video controls playsInline preload="metadata" src={mediaSrc} aria-label={post.media_alt || "Post video"} /> : <img src={mediaSrc} alt={mediaAlt} loading="lazy" />}</div> : null}
    <div className="fc-post-counts"><span>{post.reaction_count.toLocaleString()} {post.reaction_count === 1 ? "like" : "likes"}</span><span>{post.comment_count.toLocaleString()} {post.comment_count === 1 ? "comment" : "comments"}</span></div>
    <div className="fc-post-actions">{viewerId ? <CircleLikeForm postId={post.id} liked={!!post.liked_by_me} count={post.reaction_count} /> : <Link href="/auth/login" className="fc-post-action-link">Like</Link>}<button type="button" onClick={() => setCommentsOpen((open) => !open)} aria-expanded={commentsOpen} aria-controls={`comments-${post.id}`}><MessageCircle size={17} aria-hidden /> Comment</button><SharePostButton post={post} home={home} /></div>
    {commentsOpen ? <section className="fc-post-discussion" id={`comments-${post.id}`} aria-label={`Comments on ${post.title || "post"}`}><h3>Conversation</h3><div className="fc-post-comments">{roots.length ? roots.map((comment) => <CommentThread postId={post.id} comment={comment} replies={comments.filter((reply) => reply.parent_comment_id === comment.id)} canInteract={!!viewerId} key={comment.id} />) : <p className="fc-post-no-comments">{post.comment_count && !viewerId ? "This example has no saved conversation." : "No comments yet. Start the conversation."}</p>}{viewerId ? <CircleCommentForm postId={post.id} /> : <Link className="fc-post-signin" href="/auth/login">Sign in to comment or reply</Link>}</div></section> : null}
  </article>;
}

export function CircleTimeline({ posts, viewerId, canReport, variant = "circle" }: { posts: Post[]; viewerId: string | null; canReport: boolean; variant?: "circle" | "home" }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(variant === "home" ? 30 : 8);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = posts.filter((post) => (filter === "all" || post.kind === filter) && (!normalizedQuery || `${post.title ?? ""} ${post.body} ${post.profiles?.display_name ?? ""} ${post.communities?.name ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)));

  return <div className={`fc-social-feed${variant === "home" ? " fc-social-feed--home" : ""}`}>
    {variant === "circle" ? <div className="fc-social-toolbar"><div className="fc-social-filters" aria-label="Filter posts">{[{ value: "all", label: "Latest" }, { value: "question", label: "Questions" }, { value: "coach_tip", label: "Coach tips" }, { value: "milestone", label: "Milestones" }].map((option) => <button key={option.value} type="button" className={filter === option.value ? "is-active" : ""} aria-pressed={filter === option.value} onClick={() => { setFilter(option.value); setLimit(8); }}>{option.label}</button>)}</div><label className="fc-social-search"><Search size={17} aria-hidden /><span className="sr-only">Search posts</span><input value={query} onChange={(event) => { setQuery(event.target.value); setLimit(8); }} placeholder="Search posts" /></label></div> : null}
    {variant === "circle" ? <p className="fc-social-count">{filtered.length} {filtered.length === 1 ? "post" : "posts"}</p> : null}
    {filtered.length ? filtered.slice(0, limit).map((post) => <PostCard post={post} viewerId={viewerId} canReport={canReport} home={variant === "home"} key={post.id} />) : <p className="fc-social-empty">{posts.length ? "No posts match. Try another filter or search." : "No posts are available yet. Be the first to share an update."}</p>}
    {filtered.length > limit ? <button className="fc-button fc-button--quiet fc-social-more" type="button" onClick={() => setLimit((current) => current + 8)}>Show more posts</button> : null}
  </div>;
}
