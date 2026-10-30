import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Database, Inbox, type LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, description, actions, backHref }: { eyebrow: string; title: string; description: string; actions?: React.ReactNode; backHref?: string }) {
  return (
    <header className="fc-page-header">
      <div>
        {backHref ? <Link href={backHref} className="fc-back-link"><ArrowLeft size={15} aria-hidden /> Back</Link> : null}
        <p className="fc-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="fc-page-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({ title, description, href, actionLabel = "See all" }: { title: string; description?: string; href?: string; actionLabel?: string }) {
  return <div className="fc-section-head"><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{href ? <Link href={href}>{actionLabel} <ArrowUpRight size={15} aria-hidden /></Link> : null}</div>;
}

export function MetricCard({ icon: Icon, label, value, detail, tone = "default" }: { icon: LucideIcon; label: string; value: string | number; detail: string; tone?: "default" | "accent" | "reward" | "success" }) {
  return <article className={`fc-metric-card fc-metric-card--${tone}`}><span><Icon size={18} aria-hidden />{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

const portraitTiles: Record<string, [number, number]> = {
  "maya nasser": [0, 0], maya_moves: [0, 0],
  "omar khalid": [1, 0], omar_builds: [1, 0],
  "lena torres": [2, 0], lena_recovers: [2, 0],
  "noor rahman": [3, 0], noor_runs: [3, 0],
  "kai santos": [0, 1], kai_consistent: [0, 1],
  "sam rivera": [1, 1], sam_rivera: [1, 1],
  "jordan lee": [2, 1], jordan_lee: [2, 1],
  "tara noor": [3, 1], tara_noor: [3, 1],
  "maya adams": [0, 2], maya_adams: [0, 2],
  "amira hassan": [1, 2], amira_hassan: [1, 2],
};

export function Avatar({ name, handle, tone = "member", size = "md" }: { name?: string | null; handle?: string | null; initials?: string; tone?: string; size?: "sm" | "md" | "lg" }) {
  const tile = portraitTiles[handle?.toLowerCase() ?? ""] ?? portraitTiles[name?.toLowerCase() ?? ""];
  return <span
    className={`fc-avatar fc-avatar--${tone} fc-avatar--${size} ${tile ? "fc-avatar--portrait" : "fc-avatar--brand"}`}
    style={tile ? { backgroundPosition: `${tile[0] * 100 / 3}% ${tile[1] * 50}%` } : undefined}
    aria-hidden="true"
  />;
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "reward" | "success" | "danger" }) {
  return <span className={`fc-status-badge fc-status-badge--${tone}`}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="fc-progress" aria-label={`${label}: ${value}%`}><span><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span><small>{label}</small></div>;
}

export function EmptyState({ title, description, href, actionLabel }: { title: string; description: string; href?: string; actionLabel?: string }) {
  return <div className="fc-empty-state"><Inbox size={24} aria-hidden /><h3>{title}</h3><p>{description}</p>{href && actionLabel ? <Link href={href} className="fc-button fc-button--quiet">{actionLabel}</Link> : null}</div>;
}

export function LocalDataNote({ children = "Local Supabase provides saved data when available; offline preview shows synthetic examples." }: { children?: React.ReactNode }) {
  return <p className="fc-local-note"><Database size={15} aria-hidden />{children}</p>;
}
