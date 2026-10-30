import Link from "next/link";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { createAdminSupabaseClient } from "../../../lib/supabase/admin";
import { isOfflinePreview } from "../../../lib/supabase/availability";
import { ApplyReferralCodeForm, CreateReferralCodeForm } from "../../components/engagement-forms";
import { LocalDataNote, PageHeader, SectionHeader } from "../../components/workspace-ui";

export const metadata = { title: "Referrals" };
export default async function ReferralsPage() {
  const db = await isOfflinePreview() ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const registered = !!user && !user.is_anonymous;
  const [code, attribution] = registered && db ? await Promise.all([
    db.from("referral_codes").select("code,created_at").eq("owner_id", user!.id).maybeSingle(),
    db.from("referral_attributions").select("code,created_at").eq("referred_user_id", user!.id).maybeSingle(),
  ]) : [null, null];
  let invitedCount: number | null = null;
  if (registered) {
    try { const admin = createAdminSupabaseClient(); const count = await admin.from("referral_attributions").select("referred_user_id", { count: "exact", head: true }).eq("referrer_user_id", user!.id); invitedCount = count.count; } catch { /* Local service key is optional outside configured mode. */ }
  }
  return <div className="fc-page"><PageHeader eyebrow="Invitations" title="Referrals" description="Create a shareable code and record who invited you to Healthy Life." /><LocalDataNote>Attribution is saved locally. No qualification, coin or cash reward is calculated.</LocalDataNote>{registered ? <><section className="fc-panel"><SectionHeader title="Your code" />{code?.data ? <><strong className="fc-referral-code">{code.data.code}</strong><p>{invitedCount ?? "—"} recorded accounts used your code.</p></> : <CreateReferralCodeForm />}</section><section className="fc-panel"><SectionHeader title="Who invited you?" />{attribution?.data ? <p>Code {attribution.data.code} recorded on {new Date(attribution.data.created_at).toLocaleDateString("en-AE")}.</p> : <ApplyReferralCodeForm />}</section></> : <section className="fc-panel"><p><Link href="/auth/login">Sign in to a registered account</Link> to use referrals.</p></section>}</div>;
}
