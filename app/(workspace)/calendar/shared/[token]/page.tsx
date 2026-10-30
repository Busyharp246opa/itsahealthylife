import { notFound } from "next/navigation";
import { getSharedWeeklySchedule, selectedWeek } from "../../../../../lib/weekly-training";
import { TrainingWeek, TrainingWeekNavigation } from "../../../../components/training-week";
import { PageHeader } from "../../../../components/workspace-ui";

export const metadata = { title: "Shared training schedule" };
export const dynamic = "force-dynamic";

export default async function SharedTrainingSchedulePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ week?: string }> }) {
  const { token } = await params;
  const query = await searchParams;
  const shared = await getSharedWeeklySchedule(token);
  if (!shared) notFound();
  const monday = selectedWeek(query.week);
  return <div className="fc-page"><PageHeader eyebrow="Shared read-only schedule" title={shared.schedule.title} description={`${shared.program.title} · weekly outline from ${shared.schedule.starts_on}.`} /><p className="fc-local-note">The owner chose to share this exercise plan. You can view it here, but cannot change it or see private workout logs.</p><TrainingWeekNavigation monday={monday} baseHref={`/calendar/shared/${token}`} /><TrainingWeek program={shared.program} startsOn={shared.schedule.starts_on} monday={monday} /></div>;
}
