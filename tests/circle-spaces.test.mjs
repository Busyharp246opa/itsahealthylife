import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

async function account(t, role = "member", pendingSetup = false) {
  const email = `circle-space-${crypto.randomUUID()}@example.test`;
  const password = "Abcd1234";
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  t.after(async () => { await service.auth.admin.deleteUser(created.data.user.id); });
  if (["coachsphere", "fitsphere"].includes(role)) {
    const profile = await service.from("profiles").update({ role, is_verified: true, is_public: true }).eq("user_id", created.data.user.id);
    assert.ifError(profile.error);
    const onboarding = await service.from("trainer_onboarding").insert({ user_id: created.data.user.id, source: "application", must_change_password: pendingSetup });
    assert.ifError(onboarding.error);
  }
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const signed = await db.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  const profile = await db.from("profiles").select("id").eq("user_id", created.data.user.id).single();
  assert.ifError(profile.error);
  return { db, userId: created.data.user.id, profileId: profile.data.id };
}

test("Circle writes stay role scoped while members can read public coach posts", async (t) => {
  const trainee = await account(t);
  const trainer = await account(t, "coachsphere");
  const pendingTrainer = await account(t, "coachsphere", true);
  const otherTrainee = await account(t);
  const traineePost = await trainee.db.from("posts").insert({ author_user_id: trainee.userId, author_profile_id: trainee.profileId, body: "A trainee training update", circle_space: "trainee" }).select("id").single();
  assert.ifError(traineePost.error);
  const trainerPost = await trainer.db.from("posts").insert({ author_user_id: trainer.userId, author_profile_id: trainer.profileId, body: "A trainer coaching note", circle_space: "trainer" }).select("id").single();
  assert.ifError(trainerPost.error);
  const wrongTrainerPost = await trainer.db.from("posts").insert({ author_user_id: trainer.userId, author_profile_id: trainer.profileId, body: "Wrong audience", circle_space: "trainee" });
  const wrongTraineePost = await trainee.db.from("posts").insert({ author_user_id: trainee.userId, author_profile_id: trainee.profileId, body: "Wrong audience", circle_space: "trainer" });
  assert.ok(wrongTrainerPost.error);
  assert.ok(wrongTraineePost.error);
  const pendingPost = await pendingTrainer.db.from("posts").insert({ author_user_id: pendingTrainer.userId, author_profile_id: pendingTrainer.profileId, body: "Before account setup", circle_space: "trainer" });
  assert.ok(pendingPost.error);

  const traineeFeed = await trainee.db.from("posts").select("id").in("id", [traineePost.data.id, trainerPost.data.id]);
  const trainerFeed = await trainer.db.from("posts").select("id").in("id", [traineePost.data.id, trainerPost.data.id]);
  assert.ifError(traineeFeed.error);
  assert.ifError(trainerFeed.error);
  assert.deepEqual(traineeFeed.data.map((row) => row.id).sort(), [traineePost.data.id, trainerPost.data.id].sort());
  assert.deepEqual(trainerFeed.data.map((row) => row.id), [trainerPost.data.id]);
  const pendingFeed = await pendingTrainer.db.from("posts").select("id").in("id", [traineePost.data.id, trainerPost.data.id]);
  assert.ifError(pendingFeed.error);
  assert.equal(pendingFeed.data.length, 0);

  const like = await otherTrainee.db.from("post_reactions").insert({ post_id: traineePost.data.id, user_id: otherTrainee.userId, reaction: "like" });
  assert.ifError(like.error);
  const crossLike = await trainer.db.from("post_reactions").insert({ post_id: traineePost.data.id, user_id: trainer.userId, reaction: "like" });
  assert.ok(crossLike.error);
  const trainerLikes = await trainer.db.from("post_reactions").select("post_id").eq("post_id", traineePost.data.id);
  assert.ifError(trainerLikes.error);
  assert.equal(trainerLikes.data.length, 0);

  const comment = await otherTrainee.db.from("post_comments").insert({ post_id: traineePost.data.id, author_user_id: otherTrainee.userId, author_profile_id: otherTrainee.profileId, body: "Nice work" }).select("id").single();
  assert.ifError(comment.error);
  const crossComment = await trainer.db.from("post_comments").insert({ post_id: traineePost.data.id, author_user_id: trainer.userId, author_profile_id: trainer.profileId, body: "Cross-space attempt" });
  assert.ok(crossComment.error);
  const hiddenComments = await trainer.db.from("post_comments").select("id").eq("post_id", traineePost.data.id);
  assert.ifError(hiddenComments.error);
  assert.equal(hiddenComments.data.length, 0);
  const counts = await trainee.db.from("posts").select("reaction_count,comment_count").eq("id", traineePost.data.id).single();
  assert.ifError(counts.error);
  assert.equal(counts.data.reaction_count, 1);
  assert.equal(counts.data.comment_count, 1);

  const unlike = await otherTrainee.db.from("post_reactions").delete().eq("post_id", traineePost.data.id).eq("user_id", otherTrainee.userId);
  const removeComment = await otherTrainee.db.from("post_comments").delete().eq("id", comment.data.id);
  assert.ifError(unlike.error);
  assert.ifError(removeComment.error);
  const cleared = await trainee.db.from("posts").select("reaction_count,comment_count").eq("id", traineePost.data.id).single();
  assert.equal(cleared.data.reaction_count, 0);
  assert.equal(cleared.data.comment_count, 0);
});

test("member home sees both coach types and saves likes, comments, and one-level replies", async (t) => {
  const member = await account(t);
  const fitsphere = await account(t, "fitsphere");
  const coachsphere = await account(t, "coachsphere");
  const fitPost = await fitsphere.db.from("posts").insert({
    author_user_id: fitsphere.userId, author_profile_id: fitsphere.profileId,
    body: "A public class update", circle_space: "trainer", audience: "public",
  }).select("id").single();
  const coachPost = await coachsphere.db.from("posts").insert({
    author_user_id: coachsphere.userId, author_profile_id: coachsphere.profileId,
    body: "A public coaching note", circle_space: "trainer", audience: "public",
  }).select("id").single();
  assert.ifError(fitPost.error);
  assert.ifError(coachPost.error);

  const homePosts = await member.db.from("posts").select("id").in("id", [fitPost.data.id, coachPost.data.id]);
  assert.ifError(homePosts.error);
  assert.deepEqual(homePosts.data.map((row) => row.id).sort(), [fitPost.data.id, coachPost.data.id].sort());
  const like = await member.db.from("post_reactions").insert({ post_id: fitPost.data.id, user_id: member.userId, reaction: "like" });
  assert.ifError(like.error);
  const comment = await member.db.from("post_comments").insert({
    post_id: fitPost.data.id, author_user_id: member.userId, author_profile_id: member.profileId, body: "Helpful session idea",
  }).select("id").single();
  assert.ifError(comment.error);
  const reply = await coachsphere.db.from("post_comments").insert({
    post_id: fitPost.data.id, author_user_id: coachsphere.userId, author_profile_id: coachsphere.profileId,
    parent_comment_id: comment.data.id, body: "I will try that too",
  }).select("id,parent_comment_id").single();
  assert.ifError(reply.error);
  assert.equal(reply.data.parent_comment_id, comment.data.id);
  const counts = await member.db.from("posts").select("reaction_count,comment_count").eq("id", fitPost.data.id).single();
  assert.ifError(counts.error);
  assert.deepEqual(counts.data, { reaction_count: 1, comment_count: 2 });

  const wrongPostReply = await member.db.from("post_comments").insert({
    post_id: coachPost.data.id, author_user_id: member.userId, author_profile_id: member.profileId,
    parent_comment_id: comment.data.id, body: "Wrong post",
  });
  assert.ok(wrongPostReply.error);
  const nestedReply = await member.db.from("post_comments").insert({
    post_id: fitPost.data.id, author_user_id: member.userId, author_profile_id: member.profileId,
    parent_comment_id: reply.data.id, body: "Nested reply",
  });
  assert.ok(nestedReply.error);

  const hideCoach = await service.from("profiles").update({ is_public: false }).eq("user_id", fitsphere.userId);
  assert.ifError(hideCoach.error);
  const hidden = await member.db.from("posts").select("id").eq("id", fitPost.data.id);
  assert.ifError(hidden.error);
  assert.equal(hidden.data.length, 0);
});

test("Face Off invitations, open matches, and post media stay inside the signed Circle", async (t) => {
  const alice = await account(t);
  const bob = await account(t);
  const coach = await account(t, "coachsphere");
  const publishBob = await service.from("profiles").update({ is_public: true }).eq("user_id", bob.userId);
  assert.ifError(publishBob.error);
  const date = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const open = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.userId, circle_space: "trainee", goal: "Walk for thirty minutes on three days",
    target_date: date, status: "open",
  }).select("id").single();
  assert.ifError(open.error);
  const available = await bob.db.from("faceoff_matches").select("id").eq("id", open.data.id);
  const hiddenFromCoach = await coach.db.from("faceoff_matches").select("id").eq("id", open.data.id);
  assert.equal(available.data.length, 1);
  assert.equal(hiddenFromCoach.data.length, 0);
  const wrongSpace = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.userId, circle_space: "trainer", goal: "Cross space challenge",
    target_date: date, status: "open",
  });
  assert.ok(wrongSpace.error);
  const wrongInvitee = await coach.db.from("faceoff_matches").insert({
    creator_user_id: coach.userId, invitee_user_id: bob.userId, circle_space: "trainer",
    goal: "Invite a trainee from trainer space", target_date: date, status: "invited",
  });
  assert.ok(wrongInvitee.error);
  const invite = await alice.db.from("faceoff_matches").insert({
    creator_user_id: alice.userId, invitee_user_id: bob.userId, circle_space: "trainee",
    goal: "Complete two strength sessions", target_date: date, status: "invited",
  }).select("id").single();
  assert.ifError(invite.error);
  const coachInvite = await coach.db.from("faceoff_matches").select("id").eq("id", invite.data.id);
  assert.equal(coachInvite.data.length, 0);
  const accepted = await bob.db.from("faceoff_matches").update({ status: "active", opponent_user_id: bob.userId })
    .eq("id", invite.data.id).eq("status", "invited").select("id").single();
  assert.ifError(accepted.error);
  const secondAccept = await bob.db.from("faceoff_matches").update({ status: "active", opponent_user_id: bob.userId })
    .eq("id", invite.data.id).eq("status", "invited").select("id");
  assert.equal(secondAccept.data.length, 0);
  const claimed = await bob.db.from("faceoff_matches").update({ status: "active", opponent_user_id: bob.userId })
    .eq("id", open.data.id).eq("status", "open").select("id").single();
  assert.ifError(claimed.error);

  const path = alice.userId + "/" + crypto.randomUUID() + ".png";
  const uploaded = await alice.db.storage.from("post-media").upload(path, new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), { contentType: "image/png" });
  assert.ifError(uploaded.error);
  try {
    const post = await alice.db.from("posts").insert({
      author_user_id: alice.userId, author_profile_id: alice.profileId, body: "",
      circle_space: "trainee", media_path: path, media_type: "image/png", media_alt: "Test image",
    }).select("id").single();
    assert.ifError(post.error);
    const ownMedia = await alice.db.storage.from("post-media").download(path);
    const otherMemberMedia = await bob.db.storage.from("post-media").download(path);
    const crossCircleMedia = await coach.db.storage.from("post-media").download(path);
    assert.ifError(ownMedia.error);
    assert.ifError(otherMemberMedia.error);
    assert.ok(crossCircleMedia.error);
    const forgedPath = await bob.db.from("posts").insert({
      author_user_id: bob.userId, author_profile_id: bob.profileId, body: "A forged path",
      circle_space: "trainee", media_path: path, media_type: "image/png",
    });
    assert.ok(forgedPath.error);
  } finally {
    await alice.db.storage.from("post-media").remove([path]);
  }
});
