"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";

export function AdminDateFilter({ from, to }: { from: string; to: string }) {
  const [pending, setPending] = useState(false);
  return <form method="get" className="fc-admin-filter-form" aria-busy={pending} onSubmit={() => setPending(true)}>
    <label>From<input type="date" name="from" defaultValue={from} /></label>
    <label>To<input type="date" name="to" defaultValue={to} /></label>
    <button type="submit" className="fc-button fc-button--primary" disabled={pending}>{pending ? <><LoaderCircle className="fc-spin" size={16} aria-hidden /> Applying…</> : "Apply dates"}</button>
    {from || to ? <Link href="/admin/overview" className="fc-button fc-button--quiet">Clear</Link> : null}
  </form>;
}
