import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getApprovedTrainerSession, getSharedTrainerClients } from "../../../../lib/trainer-clients";
import { Avatar, PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Trainer clients" };

export default async function TrainerClientsPage() {
  const session = await getApprovedTrainerSession();
  if (!session) redirect("/trainee");
  const clients = await getSharedTrainerClients(session);
  return <div className="fc-page"><PageHeader eyebrow="Trainer" title="Your clients." description="Open a shared profile to review fitness, diet, and wellness context and update the client plan." /><section className="fc-panel"><h2>Shared with you</h2>{clients.length ? <div className="fc-focus-row-list">{clients.map((client) => <Link href={`/trainer/clients/${client.user_id}`} className="fc-focus-row" key={client.user_id}><Avatar name={client.display_name} handle={client.handle} size="sm" /><span><strong>{client.display_name}</strong><small>{client.planUpdatedAt ? "Plan saved · open profile to edit" : "No plan yet · open profile to create one"}</small></span><ArrowRight size={17} aria-hidden /></Link>)}</div> : <p>No trainees are sharing with you yet. A trainee can select your profile and turn on “Share with my trainer” in Settings.</p>}</section></div>;
}
