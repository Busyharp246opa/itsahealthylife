import Link from "next/link";
import { ArrowRight, BadgeCheck, Bell, Flag, HeartHandshake, MessageCircle, ShieldCheck, Sparkles, Trophy, UsersRound } from "lucide-react";
import { PageHeader } from "../../../components/workspace-ui";
import { SignOutButton } from "../../../components/sign-out-button";

export const metadata = { title: "Administration areas" };
const areaGroups = [
  { title: "Review and respond", detail: "Keep member requests and safety cases moving.", areas: [
    { href: "/admin/trainers", label: "Trainers", detail: "Applications and onboarding", icon: UsersRound },
    { href: "/admin/support", label: "Support", detail: "Member conversations", icon: MessageCircle },
    { href: "/admin/post-reports", label: "Moderation", detail: "Reported posts", icon: ShieldCheck },
  ] },
  { title: "Run the platform", detail: "Publish what members see and join.", areas: [
    { href: "/admin/community", label: "Communities", detail: "Topic rooms", icon: UsersRound },
    { href: "/admin/challenges", label: "Challenges", detail: "Goals and dates", icon: Trophy },
    { href: "/admin/notifications", label: "Notifications", detail: "Local inbox broadcasts", icon: Bell },
    { href: "/admin/guidelines", label: "Guidelines", detail: "Circle rules", icon: Flag },
    { href: "/admin/interests", label: "Interests", detail: "Discovery topics", icon: Sparkles },
    { href: "/admin/badges", label: "Badges", detail: "Member recognition", icon: BadgeCheck },
    { href: "/admin/spotlight", label: "Spotlight", detail: "Featured coaches", icon: Sparkles },
    { href: "/admin/referrals", label: "Referrals", detail: "Codes and attribution", icon: HeartHandshake },
  ] },
];
const previewAreas = ["members", "coaches", "fitspheres", "content", "programs", "exercises", "reports", "appeals", "faceoffs", "bookings", "payments", "coins", "feature-flags", "audit-log", "data-requests", "system-status", "settings"];
export default function AdminMorePage() {
  return <div className="fc-page fc-admin-page"><PageHeader eyebrow="Operations" title="Admin areas" description="Find the next task quickly. Working tools are grouped by what you need to do." actions={<SignOutButton redirectTo="/auth/admin" />} />
    <div className="fc-admin-directory-jump"><Link href="/admin/overview">Overview</Link><a href="#review">Review and respond</a><a href="#platform">Run the platform</a><a href="#planning">Planning views</a></div>
    {areaGroups.map((group, index) => <section className="fc-admin-section" id={index === 0 ? "review" : "platform"} key={group.title}><div className="fc-admin-section-head"><div><h2>{group.title}</h2><p>{group.detail}</p></div></div><div className="fc-admin-area-grid">{group.areas.map(({ href, label, detail, icon: Icon }) => <Link href={href} className="fc-admin-area" key={href}><span className="fc-admin-queue-icon"><Icon size={19} aria-hidden /></span><span><strong>{label}</strong><small>{detail}</small></span><ArrowRight size={17} aria-hidden /></Link>)}</div></section>)}
    <details className="fc-admin-filter" id="planning"><summary>Planning views <span>These areas show case or system previews</span></summary><p>Decisions and transactions in these views are not yet wired to live workflows.</p><div className="fc-admin-preview-grid">{previewAreas.map((area) => <Link href={`/admin/${area}`} key={area}>{area.replaceAll("-", " ")} <ArrowRight size={14} aria-hidden /></Link>)}</div></details>
  </div>;
}
