"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { isOfflinePreview } from "../lib/supabase/availability";
import type { ActionResult } from "./actions";

const fail = (message: string): ActionResult => ({ status: "error", message });
const ok = (message: string): ActionResult => ({ status: "success", message });

async function postContext(postId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(postId) || await isOfflinePreview()) return null;
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return null;
  const { data: post, error } = await db.from("posts")
    .select("id,circle_space,status,communities(slug)").eq("id", postId).maybeSingle();
  if (error || !post || post.status !== "published") return null;
  return { db, user, post, path: post.circle_space === "trainer" ? "/trainer/circle" : "/circle" };
}

function refreshPostRoutes(context: NonNullable<Awaited<ReturnType<typeof postContext>>>) {
  revalidatePath(context.path);
  revalidatePath("/trainee");
  if (context.post.circle_space === "trainee" && context.post.communities?.slug) {
    revalidatePath(`/circle/communities/${context.post.communities.slug}`);
  }
}

export async function toggleCircleLike(postId: string, _previous: ActionResult): Promise<ActionResult> {
  void _previous;
  const context = await postContext(postId);
  if (!context) return fail("Sign in to like this post.");
  const { data: existing, error } = await context.db.from("post_reactions")
    .select("post_id").eq("post_id", postId).eq("user_id", context.user.id).maybeSingle();
  if (error) return fail(error.message);
  const changed = existing
    ? await context.db.from("post_reactions").delete().eq("post_id", postId).eq("user_id", context.user.id)
    : await context.db.from("post_reactions").insert({ post_id: postId, user_id: context.user.id, reaction: "like" });
  if (changed.error) return fail(changed.error.message);
  refreshPostRoutes(context);
  return ok(existing ? "Like removed." : "Post liked.");
}

export async function addCircleComment(postId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  const body = String(form.get("body") ?? "").trim();
  if (!body || body.length > 2000) return fail("Write a comment of up to 2,000 characters.");
  const parentCommentId = String(form.get("parentCommentId") ?? "").trim();
  if (parentCommentId && !/^[0-9a-f-]{36}$/i.test(parentCommentId)) return fail("Choose a valid comment to reply to.");
  const context = await postContext(postId);
  if (!context) return fail("Sign in to comment on this post.");
  if (parentCommentId) {
    const { data: parent, error } = await context.db.from("post_comments")
      .select("id,parent_comment_id").eq("id", parentCommentId).eq("post_id", postId).maybeSingle();
    if (error || !parent || parent.parent_comment_id) return fail("This reply target is no longer available.");
  }
  const { data: profile } = await context.db.from("profiles").select("id").eq("user_id", context.user.id).maybeSingle();
  if (!profile) return fail("Your local profile is not ready yet.");
  const result = await context.db.from("post_comments")
    .insert({ post_id: postId, author_user_id: context.user.id, author_profile_id: profile.id, parent_comment_id: parentCommentId || null, body });
  if (result.error) return fail(result.error.message);
  refreshPostRoutes(context);
  return ok(parentCommentId ? "Reply posted." : "Comment posted.");
}
