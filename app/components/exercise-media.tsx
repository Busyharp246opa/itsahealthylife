import { Dumbbell } from "lucide-react";
import type { Exercise } from "../../lib/fitcircle-data";
import { flowFrameUrl, hasFlowAnimation } from "../../lib/flow-exercise-media";
import { FlowExercisePreview } from "./flow-exercise-preview";
import { TechniquePlayback } from "./technique-playback";

export function ExerciseMedia({ exercise, kind = "thumbnail", steps }: { exercise: Exercise; kind?: "thumbnail" | "animation"; steps?: string[] }) {
  if (hasFlowAnimation(exercise.id)) {
    const frames: [string, string, string] = [flowFrameUrl(exercise.id, 0), flowFrameUrl(exercise.id, 1), flowFrameUrl(exercise.id, 2)];
    return <FlowExercisePreview name={exercise.name} frames={frames} compact={kind === "thumbnail"} />;
  }

  if (kind === "animation") return <TechniquePlayback steps={steps ?? exercise.steps} />;

  return <div className="fc-exercise-media fc-exercise-media--thumbnail is-unlicensed" role="img" aria-label={`${exercise.name} has written instructions without an animation`}>
    <Dumbbell size={24} aria-hidden />
    <span>{exercise.category}</span>
    <small>Instructions only</small>
  </div>;
}
