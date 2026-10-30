import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../../lib/supabase/availability";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (await isOfflinePreview()) return new NextResponse(null, { status: 503 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const db = await createServerSupabaseClient();
  const { data: post } = await db.from("posts").select("media_path,media_type").eq("id", id).eq("status", "published").maybeSingle();
  if (!post?.media_path || !post.media_type) return new NextResponse(null, { status: 404 });
  const downloaded = await db.storage.from("post-media").download(post.media_path);
  if (downloaded.error || !downloaded.data) return new NextResponse(null, { status: 404 });
  const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
  const headers = { "Content-Type": post.media_type, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes" };
  const range = request.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match) {
    const start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2] || 0));
    const end = match[1] ? Math.min(bytes.length - 1, match[2] ? Number(match[2]) : bytes.length - 1) : bytes.length - 1;
    if (start >= bytes.length || end < start) return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": "bytes */" + bytes.length } });
    return new NextResponse(bytes.slice(start, end + 1), { status: 206, headers: { ...headers, "Content-Range": "bytes " + start + "-" + end + "/" + bytes.length, "Content-Length": String(end - start + 1) } });
  }
  return new NextResponse(bytes, { headers: { ...headers, "Content-Length": String(bytes.length) } });
}
