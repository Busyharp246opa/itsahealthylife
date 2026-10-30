import Link from "next/link";
import { CalendarRange, Layers3 } from "lucide-react";
import { getTrainingData } from "../../../../lib/fitcircle-data";
import { LocalDataNote, PageHeader, StatusBadge } from "../../../components/workspace-ui";

export const metadata = { title: "Programs" };

export default async function ProgramsPage() { const { programs } = await getTrainingData(); return <div className="fc-page"><PageHeader eyebrow="Training · programs" title="Plans with a visible shape." description="Compare duration, weekly cadence, coach, and first-week sessions before you choose." backHref="/train" /><LocalDataNote /><section className="fc-program-index">{programs.map((program) => <Link href={`/train/programs/${program.slug}`} key={program.id} className={`fc-program-index-card fc-tone-${program.accent}`}><div><StatusBadge>{program.level}</StatusBadge><span>{program.profiles?.display_name}</span></div><h2>{program.title}</h2><p>{program.summary}</p><footer><span><CalendarRange size={17} aria-hidden /><strong>{program.weeks} weeks</strong></span><span><Layers3 size={17} aria-hidden /><strong>{program.sessions_per_week} / week</strong></span></footer></Link>)}</section></div>; }
