import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../lib/supabase/availability";

const bucket = "message-attachments";
const maxBytes = 10 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (await isOfflinePreview()) return invalid("Attachments need the local Supabase service.", 503);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes + 64 * 1024) return invalid("Choose a file under 10 MB.", 413);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return invalid("Sign in to send an attachment.", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return invalid("Choose a file to attach.");
  const file = form.get("file");
  const conversationId = String(form.get("conversationId") ?? "");
  const body = String(form.get("body") ?? "").trim();
  if (!(file instanceof File) || file.size < 1 || file.size > maxBytes) return invalid("Choose a file under 10 MB.");
  if (!allowedTypes.has(file.type)) return invalid("Attach a JPG, PNG, WebP, or PDF file.");
  if (!/^[0-9a-f-]{36}$/i.test(conversationId)) return invalid("Invalid conversation.");
  if (body.length > 4000) return invalid("Messages are limited to 4,000 characters.");

  const conversation = await supabase.from("conversations").select("id").eq("id", conversationId).maybeSingle();
  if (conversation.error || !conversation.data) return invalid("You cannot access this conversation.", 403);
  const profile = await supabase.from("profiles").select("id").eq("user_id", auth.user.id).single();
  if (profile.error) return invalid("Your profile is not ready yet.", 409);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "attachment";
  const path = `${conversationId}/${auth.user.id}/${crypto.randomUUID()}-${safeName}`;
  const uploaded = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploaded.error) return invalid("The attachment could not be uploaded.", 500);

  const message = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_user_id: auth.user.id,
    sender_profile_id: profile.data.id,
    body: body || "Attachment",
  }).select("id").single();
  if (message.error) {
    await supabase.storage.from(bucket).remove([path]);
    return invalid("The message could not be sent.", 500);
  }

  const saved = await supabase.from("message_attachments").insert({
    message_id: message.data.id,
    conversation_id: conversationId,
    uploader_user_id: auth.user.id,
    storage_path: path,
    file_name: (file.name || safeName).slice(0, 255),
    mime_type: file.type,
    byte_size: file.size,
  });
  if (saved.error) {
    await supabase.storage.from(bucket).remove([path]);
    return invalid("The message was sent, but its attachment could not be saved. Try again.", 500);
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath(`/trainer/messages/${conversationId}`);
  return NextResponse.json({ id: message.data.id }, { status: 201 });
}
