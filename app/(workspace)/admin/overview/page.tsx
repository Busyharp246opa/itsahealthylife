import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, MessageCircle, ShieldCheck, Trophy, UsersRound, WalletCards } from "lucide-react";
import { getLocalSuperAdmin } from "../../../../lib/supabase/super-admin";
import { AdminDateFilter } from "../../../components/admin-date-filter";
import { MetricCard, PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Admin overview" };
const validDate = (value?: string) => value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) ? value : "";

export default async function AdminOverviewPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const session = await getLocalSuperAdmin();
  const requested = await searchParams;
  const from = validDate(requested.from);
  const to = validDate(requested.to);
  if (!session) return <div className="fc-page"><PageHeader eyebrow="Administration" title="Overview" description="Operational metrics and review queues." /><p className="fc-local-note">A super admin account is required to view operational counts.</p></div>;

  const admin = session.admin;
  let members = admin.from("profiles").select("id", { count: "exact", head: true }).not("user_id", "is", null);
  let coaches = admin.from("coach_profiles").select("id", { count: "exact", head: true }).not("verified_at", "is", null);
  let communities = admin.from("communities").select("id", { count: "exact", head: true });
  let challenges = admin.from("challenges").select("id", { count: "exact", head: true });
  let subscriptions = admin.from("subscriptions").select("id", { count: "exact", head: true }).in("status", ["active", "trialing"]);
  let tickets = admin.from("support_tickets").select("id", { count: "exact", head: true });
  if (from) {
    members = members.gte("created_at", from);
    coaches = coaches.gte("created_at", from);
    communities = communities.gte("created_at", from);
    challenges = challenges.gte("starts_on", from);
    subscriptions = subscriptions.gte("created_at", from);
    tickets = tickets.gte("created_at", from);
  }
  if (to) {
    const end = `${to}T23:59:59.999Z`;
    members = members.lte("created_at", end);
    coaches = coaches.lte("created_at", end);
    communities = communities.lte("created_at", end);
    challenges = challenges.lte("starts_on", to);
    subscriptions = subscriptions.lte("created_at", end);
    tickets = tickets.lte("created_at", end);
  }
  const [counts, pendingTrainers, openTickets, openReports] = await Promise.all([
    Promise.all([members, coaches, communities, challenges, subscriptions, tickets]),
    admin.from("trainer_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_review"]),
    admin.from("post_reports").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);
  const metrics = [
    { label: "Accounts", value: counts[0].count, icon: UsersRound },
    { label: "Verified coaches", value: counts[1].count, icon: BadgeCheck },
    { label: "Communities", value: counts[2].count, icon: MessageCircle },
    { label: "Challenges", value: counts[3].count, icon: Trophy },
    { label: "Subscription records", value: counts[4].count, icon: WalletCards },
    { label: "Support tickets", value: counts[5].count, icon: CalendarDays },
  ];
  const csv = ["metric,value,from,to", ...metrics.map((item) => `${item.label},${item.value ?? ""},${from},${to}`)].join("\r\n");
  const queues = [
    { href: "/admin/trainers", label: "Trainer applications", detail: "Review new coaches and onboarding", count: pendingTrainers.count, icon: UsersRound },
    { href: "/admin/support", label: "Support conversations", detail: "Reply to members and resolve tickets", count: openTickets.count, icon: MessageCircle },
    { href: "/admin/post-reports", label: "Post reports", detail: "Review reported content", count: openReports.count, icon: ShieldCheck },
  ];

  return <div className="fc-page fc-admin-page">
    <PageHeader eyebrow="Administration" title="Overview" description="Review what needs action, then explore the live records. Fictional seed content is included in totals." actions={<Link href="/admin/more" className="fc-button fc-button--quiet">All admin areas <ArrowRight size={16} aria-hidden /></Link>} />
    <section className="fc-admin-section" aria-labelledby="admin-attention-title"><div className="fc-admin-section-head"><div><h2 id="admin-attention-title">Needs attention</h2><p>Current queues, independent of the date filter.</p></div></div><div className="fc-admin-queue-grid">{queues.map(({ href, label, detail, count, icon: Icon }) => <Link href={href} className="fc-admin-queue-card" key={href}><span className="fc-admin-queue-icon"><Icon size={19} aria-hidden /></span><span className="fc-admin-queue-copy"><strong>{label}</strong><small>{detail}</small></span><span className="fc-admin-queue-count" aria-label={`${count ?? 0} waiting`}>{count ?? "—"}</span><ArrowRight size={18} aria-hidden /></Link>)}</div></section>
    <section className="fc-admin-section" aria-labelledby="admin-records-title"><div className="fc-admin-section-head"><div><h2 id="admin-records-title">Platform at a glance</h2><p>{from || to ? `Filtered records${from ? ` from ${from}` : ""}${to ? ` to ${to}` : ""}.` : "All saved records, including seed data."}</p></div><a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="healthy-life-overview.csv" className="fc-button fc-button--quiet">Download CSV</a></div><div className="fc-metric-grid fc-admin-metrics">{metrics.map((item) => <MetricCard key={item.label} icon={item.icon} label={item.label} value={item.value ?? "—"} detail="Saved records" />)}</div></section>
    <details className="fc-admin-filter" open={!!(from || to)}><summary>Filter by date <span>Creation date in UTC; challenges use start date</span></summary><AdminDateFilter from={from} to={to} /></details>
    <p className="fc-admin-footnote">Subscription rows do not enable billing or package entitlements.</p>
  </div>;
}
