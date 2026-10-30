"use client";

import Image from "next/image";
import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Command,
  Compass,
  HeartPulse,
  ChartNoAxesCombined,
  Bell,
  Home,
  LayoutGrid,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Trophy,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Profile } from "../../lib/fitcircle-data";
import { searchFeatures, type SearchArea } from "../../lib/feature-search";
import { LocalSession } from "./local-session";
import { SignOutButton } from "./sign-out-button";
import { DataAvailableContext } from "./data-availability";
import { Avatar } from "./workspace-ui";

type Destination = { href: string; label: string; icon: LucideIcon };

const memberNav: Destination[] = [
  { href: "/trainee", label: "Home", icon: Home },
  { href: "/discover", label: "Search", icon: Search },
  { href: "/post", label: "Post", icon: Plus },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/trainee/dashboard", label: "Dashboard", icon: LayoutGrid },
];
const trainerNav: Destination[] = [
  { href: "/trainer/discover", label: "Search", icon: Search },
  { href: "/trainer/post", label: "Post", icon: Plus },
  { href: "/trainer/messages", label: "Chat", icon: MessageCircle },
  { href: "/trainer", label: "Dashboard", icon: Home },
];
const adminNav: Destination[] = [
  { href: "/admin/overview", label: "Overview", icon: Home },
  { href: "/admin/trainers", label: "Trainers", icon: UsersRound },
  { href: "/admin/support", label: "Support", icon: MessageCircle },
  { href: "/admin/post-reports", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/community", label: "Communities", icon: UsersRound },
  { href: "/admin/challenges", label: "Challenges", icon: Trophy },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/more", label: "More", icon: LayoutGrid },
];
const adminMobileNav = [adminNav[0], adminNav[1], adminNav[2], adminNav[3], adminNav[7]];
const explore: Destination[] = [
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/insights", label: "Insights", icon: ChartNoAxesCombined },
  { href: "/coaches", label: "Find a coach", icon: Compass },
  { href: "/challenges", label: "Challenges", icon: Trophy },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/auth/login", label: "Sign in", icon: ShieldCheck },
  { href: "/auth/register/trainee", label: "Join Healthy Life", icon: UsersRound },
];
function current(pathname: string, href: string) {
  if (pathname === href) return true;
  if (href === "/trainee") return false;
  if (href === "/trainee/dashboard" && pathname.startsWith("/faceoff")) return true;
  if (href === "/more") return explore.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  if (href === "/train") return pathname.startsWith("/train/");
  if (href === "/trainer") return pathname.startsWith("/trainer/faceoff");
  if (href === "/admin/more") return pathname === "/admin/more" || ["/admin/guidelines", "/admin/interests", "/admin/badges", "/admin/spotlight", "/admin/referrals"].some((area) => pathname === area || pathname.startsWith(`${area}/`));
  return pathname.startsWith(`${href}/`);
}

function Brand({ href, mobile = false }: { href: string; mobile?: boolean }) {
  return <Link href={href} className={`fc-brand fc-brand--approved${mobile ? " fc-brand--mobile" : ""}`} aria-label="It’s A Healthy Life home"><Image src="/brand/healthy-life-mark.png" alt="" width={43} height={29} priority /><strong className="fc-brand-name">IT’S A<br />HEALTHY LIFE</strong></Link>;
}

function PendingLinkIndicator() {
  const { pending } = useLinkStatus();
  return <span className={`fc-link-pending${pending ? " is-pending" : ""}`} aria-hidden><LoaderCircle className="fc-spin" size={15} /></span>;
}

export function WorkspaceShell({ children, profile, signedIn, offlinePreview }: { children: React.ReactNode; profile: Profile | null; signedIn: boolean; offlinePreview: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const mode = pathname.startsWith("/trainer") ? "trainer" : pathname.startsWith("/admin") ? "admin" : "member";
  const nav = mode === "trainer" ? trainerNav : mode === "admin" ? adminNav : memberNav;
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchReturnFocus = useRef<HTMLElement | null>(null);
  const searchResults = useRef<HTMLDivElement | null>(null);
  const searchArea: SearchArea = mode === "trainer" ? "Trainer" : mode === "admin" ? "Admin" : "Trainee";
  const commandItems = searchFeatures(query, searchArea);

  function openSearch() {
    searchReturnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActiveIndex(0);
    setCommandOpen(true);
  }

  function closeSearch() {
    setCommandOpen(false);
    requestAnimationFrame(() => searchReturnFocus.current?.focus());
  }

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (commandOpen) closeSearch(); else openSearch();
      }
      if (event.key === "Escape" && commandOpen) { event.preventDefault(); closeSearch(); }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => {
    if (commandOpen) document.getElementById(`fc-feature-result-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, commandOpen]);
  const identity = mode === "trainer" ? profile?.role === "coachsphere" ? { initials: profile.initials, name: profile.display_name, detail: "Trainer" } : { initials: "SR", name: "Trainer preview", detail: "Demo account" } : mode === "admin" ? { initials: profile?.initials ?? "OP", name: profile?.display_name ?? "Operations", detail: "Admin panel" } : { initials: profile?.initials ?? "FC", name: profile?.display_name ?? "Guest trainee", detail: profile?.role ?? "Trainee" };
  const homeHref = mode === "admin" ? "/admin" : mode === "trainer" ? "/trainer" : "/trainee";
  const topbarTitle = pathname.startsWith("/faceoff") || pathname.startsWith("/trainer/faceoff") ? "Face Off" : nav.find((item) => current(pathname, item.href))?.label ?? "Explore";

  return <DataAvailableContext.Provider value={!offlinePreview}>
    <div className={`fc-workspace fc-focus-circle fc-workspace--${mode}`}>
      <aside className="fc-route-rail" aria-label="Desktop navigation" inert={commandOpen ? true : undefined}>
        <Brand href={homeHref} />
        <div className="fc-rail-account"><Avatar name={mode === "trainer" && profile?.role !== "coachsphere" ? "Sam Rivera" : profile?.display_name} handle={mode === "trainer" && profile?.role !== "coachsphere" ? undefined : profile?.handle} size="md" /><span><strong>{identity.name}</strong><small>{identity.detail}</small></span></div>
        <p className="fc-rail-label">{mode === "admin" ? "Administration" : mode === "trainer" ? "Trainer" : "Trainee"}</p>
        <nav className="fc-route-nav" aria-label="Primary navigation">{nav.map(({ href, label, icon: Icon }, index) => <div className="fc-nav-entry" key={href}>{mode === "admin" && index === 1 ? <p className="fc-rail-label fc-rail-label--section">Review queues</p> : null}{mode === "admin" && index === 4 ? <p className="fc-rail-label fc-rail-label--section">Platform tools</p> : null}<Link href={href} className={current(pathname, href) ? "is-current" : ""} aria-current={current(pathname, href) ? "page" : undefined}><Icon size={19} aria-hidden /><span>{label}</span><PendingLinkIndicator /></Link></div>)}</nav>
        <div className="fc-rail-bottom"><Link href={mode === "admin" ? "/admin/more" : mode === "trainer" ? "/trainer/more" : "/more"}>{mode === "admin" ? "All admin areas" : "All features"}</Link>{signedIn ? <SignOutButton redirectTo={mode === "admin" ? "/auth/admin" : "/auth/login"} /> : <Link className="fc-rail-auth-link" href="/auth/login">Sign in to post</Link>}<span>Healthy Life · Focus + Circle</span></div>
      </aside>
      <div className="fc-workspace-main" inert={commandOpen ? true : undefined}>
        <header className="fc-topbar">
          <Brand href={homeHref} mobile />
          <div className="fc-topbar-title"><span>{mode === "admin" ? "Healthy Life / Admin panel" : mode === "trainer" ? "Healthy Life / Trainer" : "Healthy Life / Trainee"}</span><strong>{topbarTitle}</strong></div>
          <button type="button" className="fc-command-trigger" onClick={openSearch}><Search size={17} aria-hidden /><span>Find a feature</span><kbd><Command size={12} aria-hidden />K</kbd></button>
          <button type="button" className="fc-command-mobile-trigger" onClick={openSearch} aria-label="Search Healthy Life features"><Search size={20} aria-hidden /></button>
          <div className="fc-topbar-actions"><span className="fc-topbar-status"><LocalSession offlinePreview={offlinePreview} /></span></div>
        </header>
        {offlinePreview ? <div className="fc-offline-banner" role="status"><strong>Offline preview</strong><span>Example content is available. Saving needs the local Supabase service.</span></div> : null}
        <main className="fc-main-content">{children}</main>
        <footer className="fc-stack-footer"><span>{mode === "admin" ? "Healthy Life administration" : mode === "trainer" ? "Healthy Life trainer" : "Healthy Life trainee"}</span><span>Example data is labelled on each screen</span></footer>
      </div>
      <nav className={`fc-bottom-nav${mode === "trainer" ? " fc-bottom-nav--four" : ""}`} aria-label="Mobile primary navigation" inert={commandOpen ? true : undefined}>{(mode === "admin" ? adminMobileNav : nav).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={current(pathname, href) ? "is-current" : ""} aria-current={current(pathname, href) ? "page" : undefined}><Icon size={20} aria-hidden /><span>{label}</span><PendingLinkIndicator /></Link>)}</nav>
      {commandOpen ? <div className="fc-command-layer" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeSearch(); }}>
        <section className="fc-command-panel" role="dialog" aria-modal="true" aria-label="Search Healthy Life features">
          <div className="fc-command-search"><Search size={19} aria-hidden /><input autoFocus role="combobox" aria-label="Search features" aria-expanded="true" aria-controls="fc-feature-results" aria-activedescendant={commandItems.length ? `fc-feature-result-${activeIndex}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); if (searchResults.current) searchResults.current.scrollTop = 0; }} onKeyDown={(event) => {
            if (event.key === "ArrowDown" && commandItems.length) { event.preventDefault(); setActiveIndex((index) => (index + 1) % commandItems.length); }
            if (event.key === "ArrowUp" && commandItems.length) { event.preventDefault(); setActiveIndex((index) => (index - 1 + commandItems.length) % commandItems.length); }
            if (event.key === "Enter" && commandItems[activeIndex]) { event.preventDefault(); router.push(commandItems[activeIndex].href); closeSearch(); }
          }} placeholder="Search by keyword" /><button type="button" onClick={closeSearch} aria-label="Close search"><X size={18} aria-hidden /></button></div>
          <div className="fc-command-results" id="fc-feature-results" role="listbox" aria-label="Feature results" ref={searchResults}>
            <span className="fc-command-results-heading">{query.trim() ? `${commandItems.length} matching ${commandItems.length === 1 ? "feature" : "features"}` : `Suggested for ${searchArea.toLowerCase()}s`}</span>
            {commandItems.map((item, index) => <Link href={item.href} key={`${item.href}-${item.title}`} id={`fc-feature-result-${index}`} role="option" aria-selected={index === activeIndex} className={index === activeIndex ? "is-active" : ""} onMouseEnter={() => setActiveIndex(index)} onClick={closeSearch}><Search size={17} aria-hidden /><span><strong>{item.title}</strong><small>{item.description}</small></span><em>{item.area}</em><PendingLinkIndicator /></Link>)}
            {!commandItems.length ? <p className="fc-command-empty">No matching feature. Try a different word, such as “workout,” “meal,” or “trainer.”</p> : null}
          </div>
          <p className="fc-command-hint"><span className="fc-command-hint-desktop">Use ↑ ↓ to choose, Enter to open, Esc to close.</span><span className="fc-command-hint-mobile">Try “calories”, “workout”, or “privacy”.</span></p>
        </section>
      </div> : null}
    </div>
  </DataAvailableContext.Provider>;
}
