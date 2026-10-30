import { DiscoveryPage } from "../../components/discovery-page";
export const metadata = { title: "Search Healthy Life" };
export default function DiscoverPage({ searchParams }: { searchParams: Promise<{ category?: string | string[]; q?: string | string[] }> }) {
  return <DiscoveryPage searchParams={searchParams} space="trainee" />;
}
