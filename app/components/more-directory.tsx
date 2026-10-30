"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

type MoreItem = { href: string; label: string; detail: string };
type MoreGroup = { title: string; items: MoreItem[] };

export function MoreDirectory({ groups, signedIn = false }: { groups: MoreGroup[]; signedIn?: boolean }) {
  const [active, setActive] = useState(groups[0]?.title ?? "");
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase();
  const shown = normalized ? [...new Map(groups.flatMap((group) => group.items.filter((item) => `${item.label} ${item.detail} ${group.title}`.toLocaleLowerCase().includes(normalized))).map((item) => [item.href, item])).values()] : groups.find((group) => group.title === active)?.items ?? [];
  return <div className="fc-more-directory"><div className="fc-more-search-row"><label className="fc-more-search"><Search size={19} aria-hidden /><span className="sr-only">Find an area</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an area, goal, or tool" /></label>{signedIn ? <SignOutButton /> : null}</div><div className="fc-more-tabs" role="group" aria-label="Browse areas">{groups.map((group) => <button key={group.title} type="button" className={active === group.title && !normalized ? "is-active" : ""} aria-pressed={active === group.title && !normalized} onClick={() => { setActive(group.title); setQuery(""); }}>{group.title}</button>)}</div><div className="fc-more-results"><div className="fc-more-results-head"><h2>{normalized ? "Search results" : active}</h2><span>{shown.length} {shown.length === 1 ? "area" : "areas"}</span></div>{shown.length ? <div className="fc-more-grid">{shown.map((item) => <Link href={item.href} className="fc-more-tile" key={item.href}><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowUpRight size={19} aria-hidden /></Link>)}</div> : <p className="fc-social-empty">No areas match. Try a shorter search.</p>}</div></div>;
}
