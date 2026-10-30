import "server-only";

import { randomUUID } from "node:crypto";
import {
  CreateParticipantTokenCommand,
  CreateStageCommand,
  DeleteStageCommand,
  IVSRealTimeClient,
} from "@aws-sdk/client-ivs-realtime";

function client() {
  const region = process.env.FACEOFF_IVS_REGION;
  if (!region) throw new Error("FACEOFF_IVS_REGION is not configured");
  return new IVSRealTimeClient({ region });
}

export async function createFaceoffStage(matchId: string) {
  const result = await client().send(new CreateStageCommand({ name: `faceoff-${matchId}` }));
  if (!result.stage?.arn) throw new Error("IVS did not return a stage ARN");
  return result.stage.arn;
}

export async function issueFaceoffToken(stageArn: string, side: "creator" | "opponent" | "viewer", durationMinutes: number) {
  const result = await client().send(new CreateParticipantTokenCommand({
    stageArn,
    capabilities: side === "viewer" ? ["SUBSCRIBE"] : ["PUBLISH", "SUBSCRIBE"],
    duration: Math.max(1, Math.min(75, durationMinutes)),
    userId: `${side}-${randomUUID()}`,
    attributes: { side },
  }));
  if (!result.participantToken?.token) throw new Error("IVS did not return a participant token");
  return result.participantToken.token;
}

export async function deleteFaceoffStage(stageArn: string) {
  await client().send(new DeleteStageCommand({ arn: stageArn }));
}
