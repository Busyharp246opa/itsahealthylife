import animationIds from "./flow-exercise-ids.json";

const availableAnimations = new Set<string>(animationIds);

export const FLOW_ANIMATION_COUNT = animationIds.length;

export function hasFlowAnimation(exerciseId: string) {
  return availableAnimations.has(exerciseId);
}

export function flowFrameUrl(exerciseId: string, frame: number) {
  if (!hasFlowAnimation(exerciseId) || !Number.isInteger(frame) || frame < 0 || frame > 2) {
    throw new Error("Unknown exercise animation frame");
  }
  return `/exercise-flow/assets/${exerciseId}/frame-0${frame}.svg`;
}
