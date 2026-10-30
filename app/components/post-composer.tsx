"use client";
/* eslint-disable @next/next/no-img-element -- Blob previews never go through the Next image optimizer. */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, LoaderCircle, Video } from "lucide-react";
import type { Community } from "../../lib/fitcircle-data";
import { useDataAvailable } from "./data-availability";

export function PostComposer({ circleSpace, communities, canPublish }: { circleSpace: "trainee" | "trainer"; communities: Community[]; canPublish: boolean }) {
  const router = useRouter();
  const available = useDataAvailable();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const previewUrl = useRef<string | null>(null);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(`fc-post-draft-${circleSpace}`);
      if (!saved || !formRef.current) return;
      const draft = JSON.parse(saved) as { body?: string; kind?: string };
      const body = formRef.current.elements.namedItem("body");
      const kind = formRef.current.elements.namedItem("kind");
      if (body instanceof HTMLTextAreaElement && typeof draft.body === "string") body.value = draft.body.slice(0, 5000);
      if (kind instanceof HTMLSelectElement && typeof draft.kind === "string" && [...kind.options].some((option) => option.value === draft.kind)) kind.value = draft.kind;
      if (canPublish) sessionStorage.removeItem(`fc-post-draft-${circleSpace}`);
    } catch { /* An unavailable browser store should not block posting. */ }
  }, [canPublish, circleSpace]);
  function saveDraft(form: HTMLFormElement) {
    try {
      const data = new FormData(form);
      sessionStorage.setItem(`fc-post-draft-${circleSpace}`, JSON.stringify({ body: String(data.get("body") ?? "").slice(0, 5000), kind: String(data.get("kind") ?? "note") }));
    } catch { /* Sign-in still works without draft storage. */ }
  }
  function clearFile() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
    setFile(null);
  }
  function choose(files: FileList | null) {
    const chosen = files?.[0] ?? null;
    setError("");
    if (chosen && chosen.size > 6 * 1024 * 1024) { setError("Choose a photo or video under 6 MB."); clearFile(); return; }
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = chosen ? URL.createObjectURL(chosen) : null;
    setPreview(previewUrl.current);
    setFile(chosen);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!available || pending) return;
    const form = new FormData(event.currentTarget);
    if (!canPublish) {
      saveDraft(event.currentTarget);
      router.push("/auth/login?post=1");
      return;
    }
    if (file) form.set("file", file);
    setPending(true); setError("");
    try {
      const response = await fetch("/api/posts", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "The post could not be published."); return; }
      formRef.current?.reset(); clearFile();
      router.push(result.href);
      router.refresh();
    } catch {
      setError("Connection lost while publishing. Please try again.");
    } finally { setPending(false); }
  }
  return <form ref={formRef} onInput={(event) => { if (!canPublish) saveDraft(event.currentTarget); }} onSubmit={submit} className="fc-post-composer">
    <input type="hidden" name="circleSpace" value={circleSpace} />
    <div className="fc-post-picker">
      <label><ImagePlus size={20} aria-hidden /><span>Photo or video</span><input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(event) => choose(event.target.files)} disabled={!available || pending} /></label>
      <label><Camera size={20} aria-hidden /><span>Use camera</span><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => choose(event.target.files)} disabled={!available || pending} /></label>
    </div>
    {file && preview ? <div className="fc-post-preview">
      {file.type.startsWith("video/") ? <video src={preview} controls playsInline aria-label="Selected video preview" /> : <img src={preview} alt="Selected photo preview" />}
      <div><Video size={16} aria-hidden /><span>{file.name}</span><button type="button" onClick={clearFile}>Remove</button></div>
    </div> : <div className="fc-post-drop-hint"><ImagePlus size={34} aria-hidden /><strong>Your next update starts here</strong><span>Share a training moment, an idea, or a short clip.</span></div>}
    <label className="fc-post-caption"><span>Caption</span><textarea name="body" rows={4} maxLength={5000} placeholder="What would you like to share with your Circle?" disabled={!available || pending} /></label>
    <label className="fc-post-caption"><span>Post type</span><select name="kind" defaultValue="note" disabled={!available || pending}><option value="note">Update</option><option value="question">Question · Fit Forum</option><option value="milestone">Milestone</option>{circleSpace === "trainer" ? <option value="coach_tip">Coach tip</option> : null}</select></label>
    {file?.type.startsWith("image/") ? <label className="fc-post-caption"><span>Describe the photo <small>for accessibility</small></span><input name="alt" maxLength={240} placeholder="What is shown in the photo?" disabled={!available || pending} /></label> : null}
    {circleSpace === "trainee" ? <label className="fc-post-caption"><span>Share with</span><select name="communityId" defaultValue="" disabled={!available || pending}><option value="">Trainee Circle</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select></label> : <p className="fc-helper">Visible in Trainer Circle.</p>}
    {error ? <p className="fc-form-result fc-form-result--error" role="alert">{error}</p> : null}
    <button type="submit" className="fc-button fc-button--primary" disabled={!available || pending} aria-busy={pending}>{pending ? <LoaderCircle className="fc-spin" size={17} aria-hidden /> : null}{pending ? "Publishing…" : canPublish ? "Publish post" : "Sign in to publish"}</button>
  </form>;
}
