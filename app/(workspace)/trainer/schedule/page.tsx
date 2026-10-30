import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { PageHeader } from "../../../components/workspace-ui";

export const metadata = { title: "Trainer schedule preview" };
const appointments = [
  { day: "Friday", time: "10:00 AM", title: "Check-in with Maya", detail: "Training plan review" },
  { day: "Friday", time: "2:30 PM", title: "Session with Jordan", detail: "Strength B · example booking" },
  { day: "Monday", time: "9:00 AM", title: "Review Tara's week", detail: "Consistency update" },
];
export default function TrainerSchedulePage() {
  return <div className="fc-page"><PageHeader eyebrow="Trainer preview · example schedule" title="Your coaching week." description="See sessions and reviews together, with a next action for each client." /><section className="fc-panel"><h2>Coming up</h2><div className="fc-focus-row-list">{appointments.map((item) => <Link href="/trainer/clients" className="fc-focus-row" key={item.title}><span className="fc-focus-row__icon"><CalendarDays size={19} aria-hidden /></span><span><strong>{item.title}</strong><small>{item.day} · {item.time} · {item.detail}</small></span><ArrowRight size={17} aria-hidden /></Link>)}</div></section><p className="fc-local-note">This is a fictional trainer calendar. The member calendar remains at <Link href="/calendar">Schedule</Link>; live trainer booking management is not connected yet.</p></div>;
}
