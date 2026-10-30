import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { getApprovedTrainerSession, getSharedTrainerClients } from "../../../../lib/trainer-clients";
import { Avatar, PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Client plans" };

export default async function TrainerPlansPage() {
  const session = await getApprovedTrainerSession();
  if (!session) return <div className="fc-page"><PageHeader eyebrow="Trainer" title="Client plans." description="Approved trainers can create and update plans for trainees who currently share with them." /><section className="fc-panel"><p>Sign in as an approved trainer to manage client plans.</p><Link className="fc-button fc-button--primary" href="/auth/login">Trainer sign in</Link></section></div>;
  const clients = await getSharedTrainerClients(session);
  return <div className="fc-page"><PageHeader eyebrow="Trainer" title="Client plans." description="Choose a client to edit their training, diet, recovery, and other guidance. Changes appear in the trainee’s My plan page." /><section className="fc-panel"><h2>Current shared clients</h2>{clients.length ? <div className="fc-focus-row-list">{clients.map((client) => <Link href={`/trainer/clients/${client.user_id}#care-plan`} className="fc-focus-row" key={client.user_id}><Avatar name={client.display_name} handle={client.handle} size="sm" /><span><strong>{client.display_name}</strong><small>{client.planUpdatedAt ? `Updated ${new Intl.DateTimeFormat("en-AE", { dateStyle: "medium" }).format(new Date(client.planUpdatedAt))}` : "Create their first plan"}</small></span><ArrowRight size={17} aria-hidden /></Link>)}</div> : <div className="fc-focus-row"><ClipboardList size={20} aria-hidden /><span><strong>No shared clients yet</strong><small>When a trainee chooses you and enables sharing, they will appear here.</small></span></div>}</section></div>;
}
