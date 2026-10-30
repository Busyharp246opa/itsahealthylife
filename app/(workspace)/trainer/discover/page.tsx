import { DiscoveryPage } from "../../../components/discovery-page";
export const metadata = { title: "Trainer search" };
export default function TrainerDiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; q?: string | string[] }> }) {
  return <DiscoveryPage searchParams={searchParams} space="trainer" />;
}
