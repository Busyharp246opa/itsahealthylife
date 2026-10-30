import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../../lib/supabase/availability";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isOfflinePreview()) return new Response(null, { status: 503 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new Response(null, { status: 401 });
  const { data: attachment } = await supabase.from("message_attachments")
    .select("storage_path, file_name, mime_type").eq("id", id).maybeSingle();
  if (!attachment) return new Response(null, { status: 404 });
  const { data: file, error } = await supabase.storage.from("message-attachments").download(attachment.storage_path);
  if (error || !file) return new Response(null, { status: 404 });
  const safeName = attachment.file_name.replace(/[^\x20-\x7E]|["\\]/g, "_").slice(0, 120) || "attachment";
  return new NextResponse(file, {
    headers: {
      "Content-Type": attachment.mime_type,
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(attachment.file_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
