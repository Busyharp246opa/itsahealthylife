import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, options);

async function registeredUser(t) {
  const email = `care-plan-${crypto.randomUUID()}@example.test`;
  const password = "Abcd1234";
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(created.error);
  t.after(async () => { await service.auth.admin.deleteUser(created.data.user.id); });
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const signed = await db.auth.signInWithPassword({ email, password });
  assert.ifError(signed.error);
  return { db, id: created.data.user.id };
}

test("only the currently shared approved trainer can save a plan, and the trainee sees each update", async (t) => {
  const trainee = await registeredUser(t);
  const trainer = await registeredUser(t);
  const outsider = await registeredUser(t);
  const approved = await service.from("profiles").update({ role: "coachsphere", is_verified: true }).eq("user_id", trainer.id);
  assert.ifError(approved.error);
  const onboarding = await service.from("trainer_onboarding").insert({ user_id: trainer.id, source: "application", must_change_password: false });
  assert.ifError(onboarding.error);

  const shared = await trainee.db.from("trainee_details").upsert({ owner_id: trainee.id, share_with_trainer: true, coaching_opt_in: true });
  assert.ifError(shared.error);
  const link = await trainee.db.from("trainer_client_links").insert({ trainee_id: trainee.id, trainer_id: trainer.id, active: true });
  assert.ifError(link.error);

  const visibleLink = await trainer.db.from("trainer_client_links").select("trainee_id").eq("trainee_id", trainee.id);
  assert.ifError(visibleLink.error);
  assert.equal(visibleLink.data.length, 1);

  const plan = await trainer.db.from("trainer_client_care_plans").insert({
    trainee_id: trainee.id, trainer_id: trainer.id,
    training_plan: "Two full-body sessions each week",
    diet_plan: "Prepare three regular meals",
    recovery_plan: "Check in after training",
    other_guidance: "Discuss changes before progressing",
  }).select("trainee_id").single();
  assert.ifError(plan.error);
  const ownerRead = await trainee.db.from("trainer_client_care_plans").select("training_plan,diet_plan,recovery_plan,other_guidance").eq("trainee_id", trainee.id).single();
  assert.ifError(ownerRead.error);
  assert.equal(ownerRead.data.diet_plan, "Prepare three regular meals");
  assert.equal(ownerRead.data.other_guidance, "Discuss changes before progressing");

  const outsiderRead = await outsider.db.from("trainer_client_care_plans").select("trainee_id").eq("trainee_id", trainee.id);
  assert.ifError(outsiderRead.error);
  assert.equal(outsiderRead.data.length, 0);
  const outsiderWrite = await outsider.db.from("trainer_client_care_plans").update({ diet_plan: "Forged" }).eq("trainee_id", trainee.id).select("trainee_id");
  assert.ok(outsiderWrite.error || outsiderWrite.data.length === 0);
  const traineeWrite = await trainee.db.from("trainer_client_care_plans").update({ diet_plan: "Self-authored" }).eq("trainee_id", trainee.id).select("trainee_id");
  assert.ok(traineeWrite.error || traineeWrite.data.length === 0);
  const moveOwner = await trainer.db.from("trainer_client_care_plans").update({ trainee_id: outsider.id }).eq("trainee_id", trainee.id);
  assert.ok(moveOwner.error, "a trainer cannot move a plan to another account");

  const changed = await trainer.db.from("trainer_client_care_plans").update({ training_plan: "Three sessions with a lighter third day", updated_at: new Date().toISOString() }).eq("trainee_id", trainee.id).select("training_plan").single();
  assert.ifError(changed.error);
  const updatedForOwner = await trainee.db.from("trainer_client_care_plans").select("training_plan").eq("trainee_id", trainee.id).single();
  assert.equal(updatedForOwner.data.training_plan, changed.data.training_plan);

  const revoked = await trainee.db.from("trainee_details").update({ share_with_trainer: false }).eq("owner_id", trainee.id);
  assert.ifError(revoked.error);
  const trainerAfterRevoke = await trainer.db.from("trainer_client_care_plans").select("trainee_id").eq("trainee_id", trainee.id);
  assert.ifError(trainerAfterRevoke.error);
  assert.equal(trainerAfterRevoke.data.length, 0);
  const rejectedUpdate = await trainer.db.from("trainer_client_care_plans").update({ diet_plan: "After revocation" }).eq("trainee_id", trainee.id).select("trainee_id");
  assert.ok(rejectedUpdate.error || rejectedUpdate.data.length === 0);
  const retained = await trainee.db.from("trainer_client_care_plans").select("diet_plan").eq("trainee_id", trainee.id).single();
  assert.ifError(retained.error);
  assert.equal(retained.data.diet_plan, "Prepare three regular meals");
});
