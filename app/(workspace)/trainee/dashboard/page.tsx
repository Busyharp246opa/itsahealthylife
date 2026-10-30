import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CalendarDays, ClipboardList, Dumbbell, MessageCircle, Radio, Store, Swords, Trophy, Utensils, type LucideIcon } from "lucide-react";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { isOfflinePreview } from "../../../../lib/supabase/availability";
import { Avatar, LocalDataNote } from "../../../components/workspace-ui";

export const metadata = { title: "Dashboard" };

const shortcuts: { href: string; label: string; detail: string; icon: LucideIcon }[] = [
  { href: "/circle", label: "Message board", detail: "Your community", icon: MessageCircle },
  { href: "/train", label: "My fitness", detail: "Training and workouts", icon: Dumbbell },
  { href: "/faceoff", label: "Face Off", detail: "Challenge someone live", icon: Swords },
  { href: "/wellness#meals", label: "My nutrition", detail: "Meals and wellness", icon: Utensils },
  { href: "/store", label: "Store", detail: "Browse the catalog", icon: Store },
  { href: "/my-plan", label: "My plan", detail: "Trainer guidance", icon: ClipboardList },
  { href: "/discover?category=live-class", label: "Live classes", detail: "Coming soon", icon: Radio },
  { href: "/calendar", label: "My calendar", detail: "Your training week", icon: CalendarDays },
  { href: "/badges", label: "Badges", detail: "Your recognition", icon: BadgeCheck },
  { href: "/challenges", label: "Challenges", detail: "Shared goals", icon: Trophy },
];

export default async function MemberDashboard() {
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const dateLabel = new Intl.DateTimeFormat("en", { timeZone: "Asia/Dhaka", weekday: "short", day: "numeric", month: "long" }).format(new Date());
  let member: { display_name: string; handle: string | null; avatar_tone: string | null } | null = null;

  if (db) {
    const { data: { user } } = await db.auth.getUser();
    if (user && !user.is_anonymous) {
      const profileResult = await db.from("profiles").select("display_name,handle,avatar_tone").eq("user_id", user.id).maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      member = profileResult.data;
    }
  }

  const firstName = member?.display_name?.trim().split(/\s+/)[0] ?? "there";

  return <div className="fc-page fc-member-dashboard">
    <section className="fc-dashboard-hero" aria-labelledby="dashboard-title">
      <div className="fc-dashboard-intro"><span>{dateLabel}</span><div className="fc-dashboard-greeting"><div><p>YOUR DASHBOARD</p><h1 id="dashboard-title">Hi, {firstName}.</h1></div><Avatar name={member?.display_name} handle={member?.handle} tone={member?.avatar_tone ?? undefined} size="lg" /></div><p>Keep your training, your goals, and your people close.</p></div>
    </section>

    <Link href="/trainee" className="fc-dashboard-feature" aria-label="Open the Healthy Life social home feed"><Image className="fc-dashboard-feature-photo" src="/brand/healthy-life-hero.webp" alt="" fill sizes="(max-width: 680px) 60vw, 520px" /><span className="fc-dashboard-feature-shade" aria-hidden /><span className="fc-dashboard-feature-copy"><small>MOVE TOGETHER</small><span className="fc-dashboard-brand-name">IT’S A HEALTHY LIFE</span><span>Open the home feed <span aria-hidden>→</span></span></span></Link>

    <section className="fc-dashboard-shortcuts" aria-label="Dashboard shortcuts"><div className="fc-dashboard-shortcuts-title"><div><span>YOUR SPACE</span><h2>Where to next?</h2></div><Link href="/trainee">Social home <span aria-hidden>→</span></Link></div><div className="fc-dashboard-shortcut-grid">{shortcuts.map(({ href, label, detail, icon: Icon }) => <Link className="fc-dashboard-shortcut" href={href} key={href}><Icon size={27} strokeWidth={1.7} aria-hidden /><strong>{label}</strong><small>{detail}</small></Link>)}</div></section>
    <LocalDataNote>{offline ? "This dashboard shows available destinations while the local service is offline." : member ? "Your dashboard links to your saved training, wellness, and community areas." : "Sign in to see your personal information. You can explore the available destinations now."}</LocalDataNote>
  </div>;
}
