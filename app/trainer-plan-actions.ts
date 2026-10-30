"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "./actions";
import { getApprovedTrainerSession } from "../lib/trainer-clients";

export async function saveTrainerClientPlan(traineeId: string, _: ActionResult, form: FormData): Promise<ActionResult> {
  const session = await getApprovedTrainerSession();
  if (!session) return { status: "error", message: "Sign in as an approved trainer to edit client plans." };
  if (!/^[0-9a-f-]{36}$/i.test(traineeId)) return { status: "error", message: "Invalid client." };
  const fields = {
    training_plan: String(form.get("trainingPlan") ?? "").trim(),
    diet_plan: String(form.get("dietPlan") ?? "").trim(),
    recovery_plan: String(form.get("recoveryPlan") ?? "").trim(),
    other_guidance: String(form.get("otherGuidance") ?? "").trim(),
  };
  if (Object.values(fields).some((value) => value.length > 4000)) return { status: "error", message: "Each plan section must be 4,000 characters or fewer." };

  // RLS checks the live trainee-controlled sharing link again at the write.
  const { data: link, error: linkError } = await session.db.from("trainer_client_links")
    .select("id").eq("trainee_id", traineeId).eq("trainer_id", session.user.id).eq("active", true).maybeSingle();
  if (linkError || !link) return { status: "error", message: "This trainee is no longer sharing with you." };

  const existing = await session.db.from("trainer_client_care_plans")
    .select("trainee_id").eq("trainee_id", traineeId).maybeSingle();
  if (existing.error) return { status: "error", message: existing.error.message };

  const saved = existing.data
    ? await session.db.from("trainer_client_care_plans")
      .update({ ...fields, trainer_id: session.user.id, updated_at: new Date().toISOString() })
      .eq("trainee_id", traineeId).select("trainee_id").maybeSingle()
    : await session.db.from("trainer_client_care_plans")
      .insert({ trainee_id: traineeId, trainer_id: session.user.id, ...fields })
      .select("trainee_id").maybeSingle();
  if (saved.error || !saved.data) return { status: "error", message: saved.error?.message ?? "Sharing changed before the plan could be saved." };

  revalidatePath(`/trainer/clients/${traineeId}`);
  revalidatePath("/trainer/plans");
  revalidatePath("/my-plan");
  revalidatePath("/today");
  return { status: "success", message: "Client plan saved. The trainee can now see these updates." };
}
