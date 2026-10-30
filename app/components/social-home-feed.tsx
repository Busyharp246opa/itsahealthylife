"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import type { Post } from "../../lib/fitcircle-data";
import { CircleTimeline } from "./circle-timeline";

type CoachSource = "fitsphere" | "coachsphere";

export function SocialHomeFeed({ posts, viewerId, initialSource }: { posts: Post[]; viewerId: string | null; initialSource: CoachSource }) {
  const [source, setSource] = useState<CoachSource>(initialSource);
  const visible = posts.filter((post) => {
    const role = post.profiles?.role;
    return role !== "fitsphere" && role !== "coachsphere" || role === source;
  });

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("post-")) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView({ block: "start" }));
  }, [source]);

  function choose(next: CoachSource) {
    setSource(next);
    const url = new URL(window.location.href);
    url.searchParams.set("coach", next);
    url.hash = "";
    window.history.replaceState(null, "", url);
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = source === "fitsphere" ? "coachsphere" : "fitsphere";
    choose(next);
    document.getElementById(`${next}-tab`)?.focus();
  }

  return <div className="fc-social-home-content">
    <div className="fc-social-home-heading"><div><p>THE HOME FEED</p><h1>In motion, together.</h1></div><span>Public coach updates and the people in your Circle</span></div>
    <div className="fc-social-home-tabs" role="tablist" aria-label="Coach content source">
      <button type="button" role="tab" id="fitsphere-tab" aria-selected={source === "fitsphere"} aria-controls="coach-feed" tabIndex={source === "fitsphere" ? 0 : -1} className={source === "fitsphere" ? "is-active" : ""} onClick={() => choose("fitsphere")} onKeyDown={handleTabKey}>Fitsphere coaches</button>
      <button type="button" role="tab" id="coachsphere-tab" aria-selected={source === "coachsphere"} aria-controls="coach-feed" tabIndex={source === "coachsphere" ? 0 : -1} className={source === "coachsphere" ? "is-active" : ""} onClick={() => choose("coachsphere")} onKeyDown={handleTabKey}>Coachsphere coaches</button>
    </div>
    <p className="fc-social-home-context">{source === "fitsphere" ? "Showing Fitsphere coach posts with community updates." : "Showing Coachsphere coach posts with community updates."}</p>
    <div id="coach-feed" role="tabpanel" aria-labelledby={source === "fitsphere" ? "fitsphere-tab" : "coachsphere-tab"}><CircleTimeline posts={visible} viewerId={viewerId} canReport={!!viewerId} variant="home" /></div>
  </div>;
}
