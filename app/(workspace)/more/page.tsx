import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { MoreDirectory } from "../../components/more-directory";
import { PageHeader } from "../../components/workspace-ui";

export const metadata = { title: "More" };

const core = [
  { href: "/my-plan", label: "My plan", detail: "Guidance from your trainer" },
  { href: "/wellness", label: "Wellness", detail: "Readiness, meals, and journal" },
  { href: "/coaches", label: "Find a coach", detail: "Profiles and availability" },
  { href: "/train/exercises", label: "Exercise library", detail: "Find a movement quickly" },
  { href: "/settings", label: "Settings", detail: "Profile and privacy" },
];
const groups = [
  { title: "Quick access", items: core },
  { title: "Progress", items: [
    { href: "/insights", label: "Insights", detail: "Saved trends and history" },
    { href: "/challenges", label: "Challenges", detail: "Shared goals" },
    { href: "/badges", label: "Badges", detail: "Recognition and awards" },
    { href: "/train/programs", label: "Programs", detail: "Training structures" },
  ] },
  { title: "Community", items: [
    { href: "/discover", label: "Discover", detail: "People and community topics" },
    { href: "/coaches", label: "Find a coach", detail: "Trainer profiles" },
    { href: "/referrals", label: "Referrals", detail: "Invitation codes" },
  ] },
  { title: "Account & help", items: [
    { href: "/settings", label: "Settings", detail: "Profile, privacy, and account" },
    { href: "/settings?tab=subscription", label: "Access packages", detail: "Compare package limits" },
    { href: "/notifications", label: "Notifications", detail: "Recent updates" },
    { href: "/support", label: "Support", detail: "Help and tickets" },
    { href: "/store", label: "Store", detail: "Example catalog" },
  ] },
];

export default async function MorePage() {
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const user = db ? (await db.auth.getUser()).data.user : null;
  const signedIn = !!user && !user.is_anonymous;
  const accountGroup = signedIn ? groups : [...groups, { title: "Join Healthy Life", items: [
    { href: "/auth/login", label: "Sign in", detail: "Return to your saved account" },
    { href: "/auth/register/trainee", label: "Create trainee account", detail: "Save progress and choose coaching" },
    { href: "/auth/register/trainer", label: "Apply as a trainer", detail: "Submit an application for review" },
  ] }];
  return <div className="fc-page fc-more-page"><PageHeader eyebrow="Explore Healthy Life" title="Where to next?" description="Jump straight to the area you need." /><MoreDirectory groups={accountGroup} signedIn={signedIn} /></div>;
}
