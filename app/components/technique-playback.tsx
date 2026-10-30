"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export function TechniquePlayback({ steps }: { steps: string[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || steps.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % steps.length), 5000);
    return () => window.clearInterval(timer);
  }, [playing, steps.length]);
  if (!steps.length) return null;
  return <div className="fc-technique-playback" aria-label="Technique step walkthrough"><div className="fc-technique-playback-head"><span>Technique walkthrough</span><strong>{index + 1} / {steps.length}</strong></div><p aria-live="polite">{steps[index]}</p><div className="fc-technique-playback-progress" aria-hidden="true">{steps.map((_, step) => <span key={step} className={step === index ? "is-active" : ""} />)}</div><div className="fc-technique-playback-controls"><button type="button" onClick={() => setIndex((current) => (current + steps.length - 1) % steps.length)} aria-label="Previous step"><ChevronLeft size={17} aria-hidden /></button><button type="button" onClick={() => setPlaying((current) => !current)} aria-label={playing ? "Pause steps" : "Play steps"}>{playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}{playing ? "Pause" : "Play steps"}</button><button type="button" onClick={() => setIndex((current) => (current + 1) % steps.length)} aria-label="Next step"><ChevronRight size={17} aria-hidden /></button></div><small>This movement has written steps and no illustrative preview.</small></div>;
}
