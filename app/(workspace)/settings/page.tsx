import Link from "next/link";
import { Bell, ChevronRight, CircleUserRound, FileDown, HelpCircle, LockKeyhole, Scale, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { SignOutButton } from "../../components/sign-out-button";
import { TraineePreferencesForm } from "../../components/trainee-preferences-form";
import { BasicProfileForm, DiscoveryChoicesForm } from "../../components/profile-detail-forms";
import { getSettingsData } from "../../../lib/fitcircle-data";
import { accessPackages, fitCirclePlus } from "../../../lib/access-packages";
import { ConsentForm, DataRequestForm, DeleteAccountForm, NotificationPreferencesForm, ProfileForm } from "../../components/mutation-forms";
import { EmptyState, LocalDataNote, PageHeader, SectionHeader, StatusBadge } from "../../components/workspace-ui";

export const metadata = { title: "Settings" };

const tabs = [
  { id: "profile", label: "Profile", icon: CircleUserRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy & consent", icon: ShieldCheck },
  { id: "subscription", label: "Subscription", icon: WalletCards },
  { id: "support", label: "Support", icon: HelpCircle },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "data", label: "Data & account", icon: LockKeyhole },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: requested } = await searchParams;
  const tab = tabs.some((item) => item.id === requested) ? requested! : "profile";
  const data = await getSettingsData();
  const consents = new Map(data.consents.map((item) => [item.scope, item.granted]));
  const offline = await isOfflinePreview();
  const supabase = offline ? null : await createServerSupabaseClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const registeredAccount = !!auth.user && !auth.user.is_anonymous;
  const registeredTrainee = !!auth.user && !auth.user.is_anonymous && data.profile?.role === "member";
  const basicDetails = registeredAccount ? await supabase!.from("member_profile_details").select("first_name,last_name,phone,country,city").eq("owner_id", auth.user!.id).maybeSingle() : null;
  const tags = supabase ? await supabase.from("discovery_tags").select("id,kind,label,priority").eq("is_active", true).order("priority", { ascending: false }).order("label") : null;
  const choices = registeredAccount ? await supabase!.from("member_discovery_choices").select("tag_id").eq("owner_id", auth.user!.id) : null;
  const detail = registeredTrainee ? await supabase!.from("trainee_details").select("coaching_opt_in, share_with_trainer, fitness_goals, fitness_level, training_preferences, diet_preferences, diet_notes, wellness_notes").eq("owner_id", auth.user!.id).maybeSingle() : null;
  const coachRows = registeredTrainee ? await supabase!.from("coach_profiles").select("profile_id").not("verified_at", "is", null) : null;
  const profileRows = coachRows?.data?.length ? await supabase!.from("profiles").select("id, user_id, display_name").in("id", coachRows.data.map((row) => row.profile_id)) : null;
  const trainers = (profileRows?.data ?? []).filter((row) => row.user_id).map((row) => ({ id: row.user_id!, name: row.display_name }));
  const selectedLink = registeredTrainee ? await supabase!.from("trainer_client_links").select("trainer_id").eq("trainee_id", auth.user!.id).eq("active", true).maybeSingle() : null;

  return <div className="fc-page">
    <PageHeader eyebrow="Account controls" title="Settings without hidden switches." description="Edit your profile, save reminders and consent, and manage your local data requests." />
    <LocalDataNote>Registered accounts save preferences to Supabase. Guest sessions remain local to this browser.</LocalDataNote>
    <div className="fc-settings-layout"><nav className="fc-settings-nav" aria-label="Settings sections">{tabs.map((item) => { const Icon = item.icon; return <Link href={`/settings?tab=${item.id}`} className={tab === item.id ? "is-current" : ""} key={item.id}><Icon size={17} aria-hidden /><span>{item.label}</span><ChevronRight size={15} aria-hidden /></Link>; })}</nav><section className="fc-settings-content">
      {tab === "profile" ? <><SectionHeader title="Your profile" description="Keep your information current and choose what a trainer may see." />{data.profile ? <ProfileForm profile={data.profile} /> : <EmptyState title="Local profile is starting" description="Refresh after the session finishes." />}{registeredAccount ? <><section className="fc-panel"><h2>Private basic details</h2><p>These fields are not shown on your public profile.</p><BasicProfileForm details={basicDetails?.data ?? null} /></section><section className="fc-panel"><h2>Interests and prompts</h2><DiscoveryChoicesForm tags={tags?.data ?? []} selected={(choices?.data ?? []).map((item) => item.tag_id)} /></section></> : null}{registeredTrainee ? <section className="fc-panel"><h2>Fitness, diet & wellness preferences</h2><TraineePreferencesForm details={detail?.data ?? null} trainers={trainers} selectedTrainer={selectedLink?.data?.trainer_id ?? ""} /></section> : registeredAccount ? <p className="fc-local-note">Trainer sharing preferences belong to trainee accounts.</p> : <p className="fc-local-note">Create a trainee account to save private preferences and choose a trainer. <Link href="/auth/register/trainee">Register</Link> or <Link href="/auth/login">sign in</Link>.</p>}</> : null}
      {tab === "notifications" ? <><SectionHeader title="Reminder preferences" description="Saved independently from wellness data consent." /><NotificationPreferencesForm preferences={data.preferences} /></> : null}
      {tab === "privacy" ? <><SectionHeader title="Processing consent" description="Purpose choices are stored separately. Provider sharing and outbound marketing are not connected in this local build." /><div className="fc-setting-list"><ConsentForm scope="wellness_personalization" granted={consents.get("wellness_personalization") ?? false} title="Allow future wellness suggestions" detail="Saved preference only; no automatic recommendation engine is connected." /><ConsentForm scope="research" granted={consents.get("research") ?? false} title="Allow future de-identified research" detail="Saved preference only; no research export runs in local mode." /><ConsentForm scope="marketing" granted={consents.get("marketing") ?? false} title="Allow future product marketing" detail="Saved preference only; no marketing delivery is connected." /></div></> : null}
      {tab === "subscription" ? <><SectionHeader title="Access packages" description="Workbook limits and known prices. Billing and entitlement enforcement are pending the approved package rules and class flows." />{data.subscriptions.length ? <div className="fc-local-note">Local subscription records: {data.subscriptions.map((item) => `${item.plan} (${item.status})`).join(", ")}. These records do not activate the packages below.</div> : null}<div className="fc-access-package-grid">{accessPackages.map((item) => <article className="fc-access-package" key={item.id}><span className="fc-access-package__eyebrow">Access package</span><h2>{item.name}</h2><strong>{item.price}</strong><dl><div><dt>Live classes</dt><dd>{item.liveClasses}</dd></div><div><dt>On-demand</dt><dd>{item.onDemand}</dd></div><div><dt>Fitcoin cap</dt><dd>{item.fitcoinCap}</dd></div></dl><ul>{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></article>)}</div><article className="fc-access-plus"><Sparkles size={22} aria-hidden /><div><span className="fc-access-package__eyebrow">Additional feature set · stacking rule pending</span><h2>{fitCirclePlus.name}</h2><strong>{fitCirclePlus.price}</strong><ul>{fitCirclePlus.features.map((feature) => <li key={feature}>{feature}</li>)}</ul></div></article><p className="fc-local-note">Core and Full prices, package stacking, reset timezone and coach subscription prices are undecided. Upgrade and checkout remain unavailable.</p></> : null}
      {tab === "support" ? <><SectionHeader title="Support" description="Open a local help ticket or inspect this development environment." /><div className="fc-support-cards"><article><h2>Support conversations</h2><p>Ask for help and track replies in your local account.</p><Link href="/support">Open support</Link></article><article><h2>Database</h2><p>Run <code>npm run supabase:status</code> and open Studio on port 56323.</p></article><article><h2>Reset demo data</h2><p>Run <code>npm run db:reset</code> to replay migrations and rolling synthetic seeds.</p></article></div></> : null}
      {tab === "legal" ? <><SectionHeader title="Local legal notices" description="Implementation guardrails for this demo." /><div className="fc-legal-copy"><h2>Health</h2><p>Healthy Life supports training organization and reflection. It does not diagnose, treat, or provide emergency services.</p><h2>Synthetic data</h2><p>Seeded people, messages, reviews, communities, transactions, and operations cases are fictional.</p><h2>Exercise source</h2><p>The text snapshot is pinned. Restricted media is not redistributed.</p></div></> : null}
      {tab === "data" ? <><SectionHeader title="Data and account lifecycle" description="Download your owner-scoped data or remove this local identity and its private rows." /><div className="fc-data-actions"><a className="fc-button fc-button--quiet" href="/api/account/export"><FileDown size={16} aria-hidden /> Download my JSON export</a><DataRequestForm requestType="correct">Request correction</DataRequestForm></div><div className="fc-panel"><h2>Delete local account</h2><p>This removes your signed identity and cascades through its private workouts, meals, journals, messages, and settings. The action cannot be undone.</p><DeleteAccountForm /></div>{data.requests.length ? <div className="fc-request-list">{data.requests.map((request) => <article key={request.id}><strong>{request.request_type}</strong><StatusBadge>{request.status}</StatusBadge><time>{new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(request.created_at))}</time></article>)}</div> : <EmptyState title="No correction requests" description="New local correction requests will appear here." />}</> : null}
    </section></div>{auth.user && !auth.user.is_anonymous ? <div className="fc-settings-signout"><SignOutButton /></div> : null}
  </div>;
}
