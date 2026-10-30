"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export type DiscoveryCard = { category: string; title: string; detail: string; href: string; count: number };

export function DiscoveryCarousel({ cards }: { cards: DiscoveryCard[] }) {
  const track = useRef<HTMLDivElement>(null);
  if (!cards.length) return null;
  return <section className="fc-discovery-featured" aria-label="Top content">
    <div className="fc-discovery-section-title"><div><span>From around Healthy Life</span><h2>Explore what’s happening</h2></div><div className="fc-discovery-controls"><button type="button" aria-label="Previous featured content" onClick={() => track.current?.scrollBy({ left: -310, behavior: "smooth" })}><ArrowLeft size={18} aria-hidden /></button><button type="button" aria-label="Next featured content" onClick={() => track.current?.scrollBy({ left: 310, behavior: "smooth" })}><ArrowRight size={18} aria-hidden /></button></div></div>
    <div className="fc-discovery-track" ref={track}>{cards.map((card) => <Link key={card.category} href={card.href} className="fc-discovery-card"><span>{card.category} · {card.count} {card.count === 1 ? "result" : "results"}</span><strong>{card.title}</strong><small>{card.detail}</small><em>Explore →</em></Link>)}</div>
  </section>;
}
