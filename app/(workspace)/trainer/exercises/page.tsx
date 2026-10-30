import { ExerciseCatalogPage } from "../../../components/exercise-catalog-page";

export const metadata = { title: "Trainer exercise catalog" };
export default function TrainerExerciseCatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; body?: string; equipment?: string; target?: string; page?: string }> }) {
  return <ExerciseCatalogPage searchParams={searchParams} basePath="/trainer/exercises" backHref="/trainer/more" />;
}
