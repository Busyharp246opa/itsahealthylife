import { ExerciseDetailPage } from "../../../../components/exercise-detail-page";

export default function TrainerExerciseDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  return <ExerciseDetailPage params={params} searchParams={searchParams} basePath="/trainer/exercises" allowAdd={false} />;
}
