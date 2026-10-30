import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

async function member(t, role = "member") {
  const email = `faceoff-${crypto.randomUUID()}@example.test`;
  const password = "Abcd1234";
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  t.after(async () => { await service.auth.admin.deleteUser(created.data.user.id); });
  if (role !== "member") {
    const updated = await service.from("profiles").update({ role, is_verified: true, is_public: true }).eq("user_id", created.data.user.id);
    assert.ifError(updated.error);
    const onboarding = await service.from("trainer_onboarding").insert({ user_id: created.data.user.id, source: "application", must_change_password: false });
    assert.ifError(onboarding.error);
  }
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const signed = await db.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  return { db, id: created.data.user.id };
}

test("live Face Off keeps spectators read-only and finalizes one winner award once", async (t) => {
  const [alice, bob, voter, coach] = await Promise.all([member(t), member(t), member(t), member(t, "coachsphere")]);
  const start = new Date(Date.now() + 60 * 60_000).toISOString();
  const match = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.id, circle_space: "trainee", goal: "Complete a safe bodyweight circuit",
    target_date: start.slice(0, 10), status: "open", live_enabled: true,
  }).select("id").single();
  assert.ifError(match.error);
  const event = await service.from("faceoff_live_events").insert({
    match_id: match.data.id, starts_at: start, duration_minutes: 15,
    rules: "Complete the circuit with clear form; viewers choose the stronger performance.",
    reward_title: "Circuit Champion",
  });
  assert.ifError(event.error);
  const accepted = await bob.db.from("faceoff_matches").update({ status: "active", opponent_user_id: bob.id })
    .eq("id", match.data.id).eq("status", "open").select("id").single();
  assert.ifError(accepted.error);
  const visible = await voter.db.from("faceoff_live_events").select("match_id").eq("match_id", match.data.id);
  const hidden = await coach.db.from("faceoff_live_events").select("match_id").eq("match_id", match.data.id);
  assert.ifError(visible.error);
  assert.equal(visible.data.length, 1);
  assert.equal(hidden.data.length, 0);
  const forgedEvent = await voter.db.from("faceoff_live_events").update({ state: "completed" }).eq("match_id", match.data.id);
  assert.ok(forgedEvent.error);
  const forgedVote = await voter.db.from("faceoff_votes").insert({ match_id: match.data.id, voter_user_id: voter.id, candidate_user_id: alice.id });
  assert.ok(forgedVote.error);
  const directRpc = await voter.db.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: alice.id, p_voter: voter.id });
  assert.ok(directRpc.error);

  const voting = await service.from("faceoff_live_events").update({
    state: "voting", live_ended_at: new Date().toISOString(),
    voting_closes_at: new Date(Date.now() + 2 * 60_000).toISOString(),
  }).eq("match_id", match.data.id);
  assert.ifError(voting.error);
  const firstVote = await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: alice.id, p_voter: voter.id });
  assert.ifError(firstVote.error);
  const secondVote = await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: bob.id, p_voter: voter.id });
  const competitorVote = await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: bob.id, p_voter: alice.id });
  const coachVote = await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: bob.id, p_voter: coach.id });
  assert.ok(secondVote.error);
  assert.ok(competitorVote.error);
  assert.ok(coachVote.error);
  const tally = await voter.db.from("faceoff_vote_tallies").select("creator_votes,opponent_votes").eq("match_id", match.data.id).single();
  assert.ifError(tally.error);
  assert.deepEqual({ creator_votes: tally.data.creator_votes, opponent_votes: tally.data.opponent_votes }, { creator_votes: 1, opponent_votes: 0 });

  const closed = await service.from("faceoff_live_events").update({ voting_closes_at: new Date(Date.now() - 1000).toISOString() }).eq("match_id", match.data.id);
  assert.ifError(closed.error);
  const result = await service.rpc("finalize_faceoff", { p_match_id: match.data.id });
  const again = await service.rpc("finalize_faceoff", { p_match_id: match.data.id });
  assert.ifError(result.error);
  assert.ifError(again.error);
  assert.equal(result.data, "creator");
  assert.equal(again.data, "creator");
  const awards = await voter.db.from("faceoff_awards").select("winner_user_id,title").eq("match_id", match.data.id);
  assert.ifError(awards.error);
  assert.deepEqual(awards.data, [{ winner_user_id: alice.id, title: "Circuit Champion" }]);
});

test("a tied vote awards no title and a cancelled challenge voids its event", async (t) => {
  const [alice, bob, firstViewer, secondViewer] = await Promise.all([member(t), member(t), member(t), member(t)]);
  const start = new Date(Date.now() + 60 * 60_000).toISOString();
  const match = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.id, circle_space: "trainee", goal: "Complete a timed mobility circuit",
    target_date: start.slice(0, 10), status: "open", live_enabled: true,
  }).select("id").single();
  assert.ifError(match.error);
  const event = await service.from("faceoff_live_events").insert({
    match_id: match.data.id, starts_at: start, duration_minutes: 10,
    rules: "Perform the same circuit and let the audience judge control and form.", reward_title: "Mobility Champion",
  });
  assert.ifError(event.error);
  const accepted = await bob.db.from("faceoff_matches").update({ status: "active", opponent_user_id: bob.id })
    .eq("id", match.data.id).eq("status", "open");
  assert.ifError(accepted.error);
  const voting = await service.from("faceoff_live_events").update({ state: "voting", live_ended_at: new Date().toISOString(),
    voting_closes_at: new Date(Date.now() + 2 * 60_000).toISOString() }).eq("match_id", match.data.id);
  assert.ifError(voting.error);
  assert.ifError((await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: alice.id, p_voter: firstViewer.id })).error);
  assert.ifError((await service.rpc("record_faceoff_vote", { p_match_id: match.data.id, p_candidate: bob.id, p_voter: secondViewer.id })).error);
  assert.ifError((await service.from("faceoff_live_events").update({ voting_closes_at: new Date(Date.now() - 1000).toISOString() }).eq("match_id", match.data.id)).error);
  const result = await service.rpc("finalize_faceoff", { p_match_id: match.data.id });
  assert.ifError(result.error);
  assert.equal(result.data, "tie");
  const noAward = await service.from("faceoff_awards").select("match_id").eq("match_id", match.data.id);
  assert.ifError(noAward.error);
  assert.equal(noAward.data.length, 0);

  const cancelledMatch = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.id, circle_space: "trainee", goal: "A second mobility challenge",
    target_date: start.slice(0, 10), status: "open", live_enabled: true,
  }).select("id").single();
  assert.ifError(cancelledMatch.error);
  assert.ifError((await service.from("faceoff_live_events").insert({ match_id: cancelledMatch.data.id,
    starts_at: start, duration_minutes: 10, rules: "Perform the same routine and let viewers choose the result.", reward_title: "Mobility Champion",
  })).error);
  const cancelled = await alice.db.from("faceoff_matches").update({ status: "cancelled" }).eq("id", cancelledMatch.data.id);
  assert.ifError(cancelled.error);
  const voided = await service.from("faceoff_live_events").select("state").eq("match_id", cancelledMatch.data.id).single();
  assert.ifError(voided.error);
  assert.equal(voided.data.state, "void");
});
