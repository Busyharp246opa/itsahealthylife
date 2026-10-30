"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, HeartPulse, NotebookPen, Salad } from "lucide-react";

type Section = "readiness" | "meals" | "journal" | "guides";
const sections = [
  { id: "readiness", label: "Check in", icon: HeartPulse, description: "Notice how you feel" },
  { id: "meals", label: "Meals", icon: Salad, description: "Log and review food" },
  { id: "journal", label: "Journal", icon: NotebookPen, description: "Keep a private note" },
  { id: "guides", label: "Food guides", icon: BookOpen, description: "Read sourced advice" },
] as const;

function sectionFromHash(): Section {
  const hash = window.location.hash.slice(1);
  return sections.find((section) => section.id === hash)?.id ?? "readiness";
}

export function WellnessSections({ readiness, meals, journal, guides }: Record<Section, ReactNode>) {
  const [active, setActive] = useState<Section>("readiness");

  useEffect(() => {
    const update = () => setActive(sectionFromHash());
    window.addEventListener("hashchange", update);
    const timer = window.setTimeout(update, 0);
    return () => { window.removeEventListener("hashchange", update); window.clearTimeout(timer); };
  }, []);

  function select(section: Section) {
    setActive(section);
    window.history.replaceState(null, "", `#${section}`);
  }

  const content = { readiness, meals, journal, guides };
  return <section className="fc-wellness-hub" aria-label="Wellness tools">
    <div className="fc-wellness-hub__heading"><div><p className="fc-eyebrow">Your wellness space</p><h2>Choose what you need today.</h2></div><p>Your entries stay private. Switch tools without losing your place.</p></div>
    <nav className="fc-wellness-hub__nav" aria-label="Wellness sections">{sections.map(({ id, label, icon: Icon, description }) => <button key={id} type="button" className={active === id ? "is-active" : ""} aria-current={active === id ? "page" : undefined} aria-controls={`wellness-${id}`} onClick={() => select(id)}><Icon size={21} aria-hidden /><span><strong>{label}</strong><small>{description}</small></span></button>)}</nav>
    {sections.map(({ id }) => <div key={id} id={`wellness-${id}`} className="fc-wellness-hub__content" hidden={active !== id}>{content[id]}</div>)}
  </section>;
}
