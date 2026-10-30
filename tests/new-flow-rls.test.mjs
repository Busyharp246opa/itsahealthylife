import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

async function client(t) {
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8").catch(() => readFile(new URL("../.env.example", import.meta.url), "utf8"));
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  const db = createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await db.auth.signInAnonymously();
  assert.ifError(result.error);
  if (t) {
    const service = await serviceClient();
    t.after(async () => { await service.auth.admin.deleteUser(result.data.user.id); });
  }
  return { db, user: result.data.user };
}

async function serviceClient() {
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  return createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function registeredClient(t) {
  const service = await serviceClient();
  const email = `flow-${crypto.randomUUID()}@example.test`;
  const password = "Abcd1234";
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  t.after(async () => { await service.auth.admin.deleteUser(created.data.user.id); });
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  const db = createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await db.auth.signInWithPassword({ email, password });
  assert.ifError(result.error);
  return { db, user: result.data.user };
}

test("support and reports are owner-scoped; blocks hide posts", async (t) => {
  const [alice, bob] = await Promise.all([registeredClient(t), registeredClient(t)]);
  const ticket = await alice.db.from("support_tickets").insert({ owner_id: alice.user.id, subject: "Private question", body: "Please help with my account", category: "account" }).select("id").single();
  assert.ifError(ticket.error);
  const aliceReply = await alice.db.from("support_messages").insert({ ticket_id: ticket.data.id, author_id: alice.user.id, body: "One more detail" });
  assert.ifError(aliceReply.error);
  const bobTicket = await bob.db.from("support_tickets").select("id").eq("id", ticket.data.id);
  const bobReplies = await bob.db.from("support_messages").select("id").eq("ticket_id", ticket.data.id);
  assert.ifError(bobTicket.error);
  assert.ifError(bobReplies.error);
  assert.equal(bobTicket.data.length, 0);
  assert.equal(bobReplies.data.length, 0);
  const forgedReply = await bob.db.from("support_messages").insert({ ticket_id: ticket.data.id, author_id: bob.user.id, body: "Unauthorized reply" });
  assert.ok(forgedReply.error);

  const profile = await alice.db.from("profiles").select("id").eq("user_id", alice.user.id).single();
  assert.ifError(profile.error);
  const post = await alice.db.from("posts").insert({ author_user_id: alice.user.id, author_profile_id: profile.data.id, body: "A public training note" }).select("id").single();
  assert.ifError(post.error);
  const visible = await bob.db.from("posts").select("id").eq("id", post.data.id);
  assert.equal(visible.data.length, 1);
  const report = await bob.db.from("post_reports").insert({ reporter_id: bob.user.id, post_id: post.data.id, reason: "other" }).select("id").single();
  assert.ifError(report.error);
  const aliceReports = await alice.db.from("post_reports").select("id").eq("id", report.data.id);
  assert.equal(aliceReports.data.length, 0);
  const block = await bob.db.from("user_blocks").insert({ owner_id: bob.user.id, blocked_user_id: alice.user.id });
  assert.ifError(block.error);
  const hidden = await bob.db.from("posts").select("id").eq("id", post.data.id);
  assert.ifError(hidden.error);
  assert.equal(hidden.data.length, 0);
  const ownPost = await alice.db.from("posts").select("id").eq("id", post.data.id);
  assert.equal(ownPost.data.length, 1);
});

test("anonymous demo accounts cannot open support or safety cases", async (t) => {
  const guest = await client(t);
  const ticket = await guest.db.from("support_tickets").insert({ owner_id: guest.user.id, subject: "Guest ticket", body: "This should be denied", category: "other" });
  assert.ok(ticket.error);
  const profile = await guest.db.from("profiles").select("id").eq("user_id", guest.user.id).single();
  assert.ifError(profile.error);
  const post = await guest.db.from("posts").insert({ author_user_id: guest.user.id, author_profile_id: profile.data.id, body: "Guest post for a safety test" }).select("id").single();
  assert.ifError(post.error);
  const report = await guest.db.from("post_reports").insert({ reporter_id: guest.user.id, post_id: post.data.id, reason: "other" });
  assert.ok(report.error);
});

test("local notification delivery is private and members cannot forge broadcasts", async (t) => {
  const [alice, bob, service] = await Promise.all([client(t), client(t), serviceClient()]);
  const campaignId = crypto.randomUUID();
  t.after(async () => {
    await service.from("notifications").delete().eq("campaign_id", campaignId);
    await service.from("notification_campaigns").delete().eq("id", campaignId);
  });
  const campaign = await service.from("notification_campaigns").insert({ id: campaignId, created_by: alice.user.id, title: "Local update", body: "Saved in your inbox" });
  assert.ifError(campaign.error);
  const delivered = await service.from("notifications").insert({ owner_id: alice.user.id, campaign_id: campaignId, kind: "admin_message", title: "Local update", body: "Saved in your inbox" }).select("id").single();
  assert.ifError(delivered.error);
  const ownerRead = await alice.db.from("notifications").select("id,title,body").eq("id", delivered.data.id);
  const otherRead = await bob.db.from("notifications").select("id").eq("id", delivered.data.id);
  assert.equal(ownerRead.data.length, 1);
  assert.equal(otherRead.data.length, 0);
  const forged = await alice.db.from("notifications").insert({ owner_id: alice.user.id, kind: "admin_message", title: "Forged", body: "Forged" });
  assert.ok(forged.error);
  const altered = await alice.db.from("notifications").update({ body: "Altered" }).eq("id", delivered.data.id);
  assert.ok(altered.error);
  const read = await alice.db.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", delivered.data.id).select("id").single();
  assert.ifError(read.error);
  const duplicate = await service.from("notifications").upsert({ owner_id: alice.user.id, campaign_id: campaignId, kind: "admin_message", title: "Local update", body: "Saved in your inbox" }, { onConflict: "campaign_id,owner_id", ignoreDuplicates: true });
  assert.ifError(duplicate.error);
  const count = await service.from("notifications").select("id", { count: "exact" }).eq("campaign_id", campaignId);
  assert.equal(count.count, 1);
  const memberChallenge = await alice.db.from("challenges").insert({ slug: crypto.randomUUID(), name: "Forged challenge", description: "No role", metric: "sessions", unit: "sessions", target: 1, starts_on: "2026-10-25", ends_on: "2026-10-26" });
  assert.ok(memberChallenge.error);
});

test("badges, referrals and verified spotlights keep their read/write boundaries", async (t) => {
  const service = await serviceClient();
  const [alice, bob] = await Promise.all([registeredClient(t), registeredClient(t)]);
  const badge = await service.from("badges").insert({ title: `Test badge ${crypto.randomUUID().slice(0, 8)}`, description: "Awarded in local test only", tier: "bronze" }).select("id").single();
  assert.ifError(badge.error);
  t.after(async () => { await service.from("badges").delete().eq("id", badge.data.id); });
  const awarded = await service.from("badge_awards").insert({ badge_id: badge.data.id, recipient_user_id: alice.user.id, awarded_by: bob.user.id });
  assert.ifError(awarded.error);
  const aliceAward = await alice.db.from("badge_awards").select("badge_id").eq("badge_id", badge.data.id);
  const bobAward = await bob.db.from("badge_awards").select("badge_id").eq("badge_id", badge.data.id);
  assert.equal(aliceAward.data.length, 1);
  assert.equal(bobAward.data.length, 0);
  const forgedAward = await bob.db.from("badge_awards").insert({ badge_id: badge.data.id, recipient_user_id: bob.user.id });
  assert.ok(forgedAward.error);

  const code = `FC${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
  const createdCode = await service.from("referral_codes").insert({ owner_id: alice.user.id, code });
  assert.ifError(createdCode.error);
  const hiddenCode = await bob.db.from("referral_codes").select("code").eq("owner_id", alice.user.id);
  assert.equal(hiddenCode.data.length, 0);
  const attribution = await service.from("referral_attributions").insert({ referred_user_id: bob.user.id, referrer_user_id: alice.user.id, code });
  assert.ifError(attribution.error);
  const bobAttribution = await bob.db.from("referral_attributions").select("code").eq("referred_user_id", bob.user.id);
  const aliceAttribution = await alice.db.from("referral_attributions").select("code").eq("referred_user_id", bob.user.id);
  assert.equal(bobAttribution.data.length, 1);
  assert.equal(aliceAttribution.data.length, 0);
  const duplicate = await service.from("referral_attributions").insert({ referred_user_id: bob.user.id, referrer_user_id: alice.user.id, code });
  assert.ok(duplicate.error);

  const coach = await service.from("coach_profiles").select("id").not("verified_at", "is", null).limit(1).single();
  assert.ifError(coach.error);
  const today = new Date().toISOString().slice(0, 10);
  const spotlight = await service.from("coach_spotlights").insert({ coach_id: coach.data.id, title: "Local spotlight test", starts_on: today, ends_on: today }).select("id").single();
  assert.ifError(spotlight.error);
  t.after(async () => { await service.from("coach_spotlights").delete().eq("id", spotlight.data.id); });
  const publicSpotlight = await alice.db.from("coach_spotlights").select("id").eq("id", spotlight.data.id);
  assert.equal(publicSpotlight.data.length, 1);
  const forgedSpotlight = await alice.db.from("coach_spotlights").insert({ coach_id: coach.data.id, title: "Member forged", starts_on: today, ends_on: today });
  assert.ok(forgedSpotlight.error);
});

test("private basic details and discovery choices respect owner and published tags", async (t) => {
  const service = await serviceClient();
  const [alice, bob] = await Promise.all([registeredClient(t), registeredClient(t)]);
  const details = await alice.db.from("member_profile_details").insert({ owner_id: alice.user.id, first_name: "Alice", last_name: "Tester", phone: "+971500000000", country: "UAE", city: "Dubai" });
  assert.ifError(details.error);
  const bobRead = await bob.db.from("member_profile_details").select("phone").eq("owner_id", alice.user.id);
  assert.ifError(bobRead.error);
  assert.equal(bobRead.data.length, 0);
  const forged = await bob.db.from("member_profile_details").update({ phone: "000" }).eq("owner_id", alice.user.id).select("owner_id");
  assert.ifError(forged.error);
  assert.equal(forged.data.length, 0);
  const tag = await service.from("discovery_tags").insert({ kind: "interest", label: `Mobility ${crypto.randomUUID().slice(0, 6)}`, priority: 90 }).select("id").single();
  assert.ifError(tag.error);
  t.after(async () => { await service.from("discovery_tags").delete().eq("id", tag.data.id); });
  const selected = await alice.db.from("member_discovery_choices").insert({ owner_id: alice.user.id, tag_id: tag.data.id });
  assert.ifError(selected.error);
  const hidden = await bob.db.from("member_discovery_choices").select("tag_id").eq("owner_id", alice.user.id);
  assert.equal(hidden.data.length, 0);
  const forgedChoice = await bob.db.from("member_discovery_choices").insert({ owner_id: alice.user.id, tag_id: tag.data.id });
  assert.ok(forgedChoice.error);
  const disabled = await service.from("discovery_tags").update({ is_active: false }).eq("id", tag.data.id);
  assert.ifError(disabled.error);
  const publicRead = await alice.db.from("discovery_tags").select("id").eq("id", tag.data.id);
  assert.equal(publicRead.data.length, 0);
  const guest = await client(t);
  const guestDetails = await guest.db.from("member_profile_details").insert({ owner_id: guest.user.id, first_name: "Guest" });
  assert.ok(guestDetails.error);
});
