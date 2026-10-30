import { getTrainerCircleSession } from "../../../../lib/circle-access";
import { MoreDirectory } from "../../../components/more-directory";
import { LocalDataNote, PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Trainer more" };
const groups = [
  { title: "Quick access", items: [
    { href: "/trainer/clients", label: "Shared clients", detail: "Review current client context" },
    { href: "/trainer/plans", label: "Client plans", detail: "Create and update guidance" },
    { href: "/trainer/circle", label: "Trainer Circle", detail: "Talk with other trainers" },
    { href: "/trainer/exercises", label: "Exercise library", detail: "Search movement technique" },
  ] },
  { title: "Practice", items: [
    { href: "/trainer/schedule", label: "Schedule preview", detail: "Explore the proposed schedule" },
    { href: "/trainer/messages", label: "Chat", detail: "Read and send messages" },
  ] },
  { title: "Account", items: [
    { href: "/settings", label: "Settings", detail: "Profile and account preferences" },
    { href: "/support", label: "Support", detail: "Help and tickets" },
  ] },
];
export default async function TrainerMorePage() {
  const session = await getTrainerCircleSession();
  return <div className="fc-page fc-more-page"><PageHeader eyebrow="Trainer" title="Your tools, one tap away." description="Open a client, plan, reference, or account area." /><MoreDirectory groups={groups} signedIn={!!session} /><LocalDataNote>Client plans use currently shared trainee records. Schedule remains a preview; chat uses existing conversations.</LocalDataNote></div>;
}
