import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

async function localClient() {
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8").catch(() => readFile(new URL("../.env.example", import.meta.url), "utf8"));
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  return createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

test("private history stays with its owner and cannot grant operator privileges", async () => {
  const alice = await localClient();
  const bob = await localClient();
  const [aliceAuth, bobAuth] = await Promise.all([alice.auth.signInAnonymously(), bob.auth.signInAnonymously()]);
  assert.ifError(aliceAuth.error);
  assert.ifError(bobAuth.error);
  const aliceId = aliceAuth.data.user.id;

  const created = await alice.from("meals").insert({ owner_id: aliceId, meal_type: "lunch", notes: "RLS test meal" }).select("id").single();
  assert.ifError(created.error);
  const bobRead = await bob.from("meals").select("id").eq("id", created.data.id);
  assert.ifError(bobRead.error);
  assert.equal(bobRead.data.length, 0);
  const bobWrite = await bob.from("meals").update({ notes: "changed" }).eq("id", created.data.id).select("id");
  assert.ifError(bobWrite.error);
  assert.equal(bobWrite.data.length, 0);

  const roleChange = await alice.from("profiles").update({ role: "super_admin" }).eq("user_id", aliceId);
  assert.ok(roleChange.error, "member must not promote their own profile");
  const operator = await alice.rpc("is_operator");
  assert.ifError(operator.error);
  assert.equal(operator.data, false);
  const caseReview = await alice.rpc("operator_update_case", { target_id: "a0000000-0000-4000-8000-000000000001", next_status: "resolved", note: "unauthorized attempt" });
  assert.ok(caseReview.error, "member must not review an operator case");
  const flagChange = await alice.rpc("operator_set_feature_flag", { flag_key: "payment_provider", next_enabled: true });
  assert.ok(flagChange.error, "member must not change feature flags");
});

test("sample history loads atomically once for the signed member", async () => {
  const client = await localClient();
  const auth = await client.auth.signInAnonymously();
  assert.ifError(auth.error);
  const first = await client.rpc("load_member_demo_history");
  assert.ifError(first.error);
  assert.equal(first.data, true);
  const second = await client.rpc("load_member_demo_history");
  assert.ifError(second.error);
  assert.equal(second.data, false);
  const [checkins, meals, workouts] = await Promise.all([
    client.from("wellness_checkins").select("id"),
    client.from("meals").select("id"),
    client.from("workouts").select("id").eq("is_template", false),
  ]);
  assert.ifError(checkins.error);
  assert.ifError(meals.error);
  assert.ifError(workouts.error);
  assert.equal(checkins.data.length, 7);
  assert.equal(meals.data.length, 3);
  assert.equal(workouts.data.length, 3);
});
