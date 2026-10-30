"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Dumbbell, Pause, Play } from "lucide-react";

const frameSequence = [0, 1, 2, 1];
const frameDurationMs = 180;

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export function FlowExercisePreview({ name, frames, compact = false }: { name: string; frames: [string, string, string]; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState(0);
  const [override, setOverride] = useState<boolean | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);
  const pageVisible = useSyncExternalStore(subscribeVisibility, () => !document.hidden, () => false);
  const playing = override ?? !reducedMotion;
  const frame = frameSequence[position];

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      const timeout = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timeout);
    }
    const observer = new IntersectionObserver((entries) => setVisible(Boolean(entries[0]?.isIntersecting)), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    Promise.all([0, 1, 2].map((index) => new Promise<boolean>((resolve) => {
      const image = new window.Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = frames[index];
    }))).then((results) => {
      if (!active) return;
      setReady(results.every(Boolean));
      setFailed(results.some((result) => !result));
    });
    return () => { active = false; };
  }, [frames, visible]);

  useEffect(() => {
    if (!ready || !visible || !pageVisible || !playing) return;
    const timer = window.setInterval(() => setPosition((current) => (current + 1) % frameSequence.length), frameDurationMs);
    return () => window.clearInterval(timer);
  }, [ready, visible, pageVisible, playing]);

  return <div ref={root} className={`fc-flow-preview${compact ? " fc-flow-preview--compact" : ""}`}>
    {failed ? <div className="fc-flow-preview-fallback"><Dumbbell size={compact ? 25 : 40} aria-hidden /><span>Preview unavailable</span></div> : <Image src={frames[frame]} alt={compact ? "" : `Illustrative movement preview of ${name}`} width={180} height={180} unoptimized loading={compact ? "lazy" : "eager"} />}
    <div className="fc-flow-preview-overlay"><span>{compact ? "Illustrative" : "Illustrative motion · not exercise tempo"}</span>{!compact ? <button type="button" aria-label={`${playing ? "Pause" : "Play"} preview of ${name}`} aria-pressed={playing} disabled={failed} onClick={() => setOverride(!playing)}>{playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}{playing ? "Pause" : "Play"}</button> : null}</div>
  </div>;
}
