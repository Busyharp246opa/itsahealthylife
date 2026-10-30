import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

async function account(t, role = "member") {
  const email = `weekly-training-${crypto.randomUUID()}@example.test`;
  const password = "Abcd1234";
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  t.after(async () => { await service.auth.admin.deleteUser(created.data.user.id); });
  if (role === "coachsphere") {
    const profile = await service.from("profiles").update({ role, is_verified: true }).eq("user_id", created.data.user.id);
    assert.ifError(profile.error);
    const onboarding = await service.from("trainer_onboarding").insert({ user_id: created.data.user.id, source: "application", must_change_password: false });
    assert.ifError(onboarding.error);
  }
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const signed = await db.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  return { db, id: created.data.user.id };
}

test("weekly programs, custom exercises, schedules and trainer sharing obey live owner RLS", async (t) => {
  const owner = await account(t);
  const stranger = await account(t);
  const trainer = await account(t, "coachsphere");

  const created = await owner.db.from("trainee_programs").insert({ owner_id: owner.id, title: "My training week", description: "Three strength days" }).select("id").single();
  assert.ifError(created.error);
  const programId = created.data.id;
  const days = await owner.db.from("trainee_program_days").select("id,weekday").eq("program_id", programId).order("weekday");
  assert.ifError(days.error);
  assert.deepEqual(days.data.map((day) => day.weekday), [1, 2, 3, 4, 5, 6, 7]);
  const mondayId = days.data[0].id;
  const custom = await owner.db.from("trainee_exercises").insert({ owner_id: owner.id, name: "Stair intervals", target: "Cardio", equipment: "Stairs" }).select("id").single();
  assert.ifError(custom.error);
  const item = await owner.db.from("trainee_program_movements").insert({ owner_id: owner.id, day_id: mondayId, custom_exercise_id: custom.data.id, position: 1, target_sets: 4, target_reps: "45 sec" });
  assert.ifError(item.error);
  const schedule = await owner.db.from("trainee_schedules").insert({ owner_id: owner.id, title: "First training block", program_id: programId, starts_on: "2026-10-26", share_token: crypto.randomUUID() }).select("id,share_token").single();
  assert.ifError(schedule.error);

  for (const table of ["trainee_programs", "trainee_program_days", "trainee_exercises", "trainee_program_movements", "trainee_schedules"]) {
    const other = await stranger.db.from(table).select("id").eq("owner_id", owner.id);
    assert.ifError(other.error);
    assert.equal(other.data.length, 0, `${table} should be private`);
    const beforeShare = await trainer.db.from(table).select("id").eq("owner_id", owner.id);
    assert.ifError(beforeShare.error);
    assert.equal(beforeShare.data.length, 0, `${table} should require trainee sharing`);
  }
  const forgedProgram = await stranger.db.from("trainee_programs").insert({ owner_id: owner.id, title: "Forged plan" });
  assert.ok(forgedProgram.error);
  const forgedItem = await stranger.db.from("trainee_program_movements").insert({ owner_id: stranger.id, day_id: mondayId, custom_exercise_id: custom.data.id, position: 2 });
  assert.ok(forgedItem.error);
  const trainerEdit = await trainer.db.from("trainee_programs").update({ title: "Trainer changed this" }).eq("id", programId).select("id");
  assert.ok(trainerEdit.error || trainerEdit.data.length === 0);

  const link = await service.from("trainer_client_links").insert({ trainee_id: owner.id, trainer_id: trainer.id, active: true });
  assert.ifError(link.error);
  const shared = await owner.db.from("trainee_details").upsert({ owner_id: owner.id, share_with_trainer: true });
  assert.ifError(shared.error);
  const trainerProgram = await trainer.db.from("trainee_programs").select("id,trainee_program_days(id,trainee_program_movements(id,trainee_exercises(name)))").eq("id", programId).single();
  assert.ifError(trainerProgram.error);
  assert.equal(trainerProgram.data.trainee_program_days.length, 7);
  const trainerSchedule = await trainer.db.from("trainee_schedules").select("id").eq("id", schedule.data.id).single();
  assert.ifError(trainerSchedule.error);
  const trainerEditAfterSharing = await trainer.db.from("trainee_programs").update({ title: "Still forbidden" }).eq("id", programId).select("id");
  assert.ok(trainerEditAfterSharing.error || trainerEditAfterSharing.data.length === 0);
  const revoked = await owner.db.from("trainee_details").update({ share_with_trainer: false }).eq("owner_id", owner.id);
  assert.ifError(revoked.error);
  const trainerAfterRevocation = await trainer.db.from("trainee_schedules").select("id").eq("id", schedule.data.id);
  assert.ifError(trainerAfterRevocation.error);
  assert.equal(trainerAfterRevocation.data.length, 0);

  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const directSharedRead = await anon.from("trainee_schedules").select("id").eq("share_token", schedule.data.share_token);
  assert.ok(directSharedRead.error || directSharedRead.data.length === 0, "share token must not expose owner tables through the Data API");
});
