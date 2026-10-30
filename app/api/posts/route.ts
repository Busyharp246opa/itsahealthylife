import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";

const bucket = "post-media";
const maxBytes = 6 * 1024 * 1024;
const mediaTypes: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "video/mp4": "mp4", "video/webm": "webm",
};

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (type === "video/mp4") return new TextDecoder().decode(bytes.slice(4, 8)) === "ftyp";
  if (type === "video/webm") return [0x1a, 0x45, 0xdf, 0xa3].every((value, index) => bytes[index] === value);
  return false;
}

export async function POST(request: Request) {
  if (await isOfflinePreview()) return invalid("Posting needs the local Supabase service.", 503);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes + 64 * 1024) return invalid("Choose a photo or video under 6 MB.", 413);
  const db = await createServerSupabaseClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user || user.is_anonymous) return invalid("Sign in to create a post.", 401);
  const form = await request.formData().catch(() => null);
  if (!form) return invalid("Could not read the post.");
  const body = String(form.get("body") ?? "").trim();
  const kind = String(form.get("kind") ?? "note");
  const alt = String(form.get("alt") ?? "").trim();
  const communityId = String(form.get("communityId") ?? "") || null;
  const requestedSpace = String(form.get("circleSpace") ?? "");
  const file = form.get("file");
  const media = file instanceof File && file.size > 0 ? file : null;
  if (!media && (body.length < 4 || body.length > 5000)) return invalid("Write at least four characters, or add a photo or video.");
  if (body.length > 5000) return invalid("Captions are limited to 5,000 characters.");
  if (!["note", "question", "milestone", "coach_tip"].includes(kind)) return invalid("Choose a valid post type.");
  if (kind === "question" && body.length < 4) return invalid("Write your question before publishing.");
  if (alt.length > 240) return invalid("Media description is limited to 240 characters.");
  if (media && (media.size > maxBytes || !mediaTypes[media.type])) return invalid("Choose a JPG, PNG, WebP, MP4, or WebM file under 6 MB.");
  if (requestedSpace !== "trainee" && requestedSpace !== "trainer") return invalid("Choose a valid Circle.");
  if (communityId && !/^[0-9a-f-]{36}$/i.test(communityId)) return invalid("Choose a valid community.");
  const { data: profile } = await db.from("profiles").select("id,role,is_verified").eq("user_id", user.id).maybeSingle();
  if (!profile) return invalid("Your profile is not ready yet.", 409);
  const actualSpace = profile.is_verified && ["coachsphere", "fitsphere"].includes(profile.role) ? "trainer" : "trainee";
  if (requestedSpace !== actualSpace || (actualSpace === "trainer" && communityId)) return invalid("This account cannot post to that Circle.", 403);
  if (kind === "coach_tip" && actualSpace !== "trainer") return invalid("Coach tips belong in Trainer Circle.", 403);

  let path: string | null = null;
  if (media) {
    const bytes = new Uint8Array(await media.arrayBuffer());
    if (!validSignature(media.type, bytes)) return invalid("This file does not match its photo or video format.");
    path = user.id + "/" + crypto.randomUUID() + "." + mediaTypes[media.type];
    const uploaded = await db.storage.from(bucket).upload(path, bytes, { contentType: media.type, upsert: false });
    if (uploaded.error) return invalid("The media could not be uploaded.", 500);
  }
  const saved = await db.from("posts").insert({
    author_user_id: user.id, author_profile_id: profile.id, title: "",
    body, kind, community_id: communityId, audience: communityId ? "community" : "public",
    circle_space: actualSpace, media_path: path, media_type: media?.type ?? null,
    media_alt: alt || (media?.type.startsWith("image/") ? body || "Member photo" : ""),
  }).select("id").single();
  if (saved.error) {
    if (path) await db.storage.from(bucket).remove([path]);
    return invalid("The post could not be published. " + saved.error.message, 500);
  }
  revalidatePath(actualSpace === "trainer" ? "/trainer/circle" : "/circle");
  revalidatePath(actualSpace === "trainer" ? "/trainer/post" : "/post");
  if (communityId) {
    const { data: community } = await db.from("communities").select("slug").eq("id", communityId).maybeSingle();
    if (community) revalidatePath("/circle/communities/" + community.slug);
  }
  return NextResponse.json({ id: saved.data.id, href: actualSpace === "trainer" ? "/trainer/circle" : "/circle" }, { status: 201 });
}
