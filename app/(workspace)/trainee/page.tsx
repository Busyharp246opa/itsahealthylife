import Link from "next/link";
import { Bell, CirclePlay, Compass, Plus } from "lucide-react";
import { getSocialHomeData } from "../../../lib/fitcircle-data";
import { SocialHomeFeed } from "../../components/social-home-feed";
import { LocalDataNote } from "../../components/workspace-ui";

export const metadata = { title: "Home" };

export default async function TraineeHome({ searchParams }: { searchParams: Promise<{ coach?: string }> }) {
  const [{ coach }, social] = await Promise.all([searchParams, getSocialHomeData()]);
  const source = coach === "coachsphere" ? "coachsphere" : "fitsphere";

  return <div className="fc-page fc-social-home">
    <header className="fc-social-home-masthead">
      <a href="/" className="fc-social-home-brand" aria-label="It’s A Healthy Life home">IT’S A HEALTHY LIFE</a>
      <div className="fc-social-home-masthead-actions"><Link href="/discover"><Compass size={18} aria-hidden /><span>Explore</span></Link><Link href="/notifications" aria-label="Notifications"><Bell size={19} aria-hidden /></Link></div>
    </header>
    <div className="fc-social-home-layout">
      <SocialHomeFeed posts={social.posts} viewerId={social.viewerId} initialSource={source} />
      <aside className="fc-social-home-side" aria-label="More ways to connect">
        <div className="fc-social-home-side-card"><span>YOUR NEXT MOVE</span><h2>Share the work.</h2><p>Post a photo, short video, or training note for your Circle.</p><Link href="/post"><Plus size={17} aria-hidden /> Create a post</Link></div>
        <div className="fc-social-home-side-links"><Link href="/circle"><CirclePlay size={18} aria-hidden /> Open your Circle</Link><Link href="/today">Training overview</Link></div>
        <LocalDataNote>{social.preview ? "This feed shows fictional examples. Sign in to like, comment, reply, or post." : "Seeded demo people and the illustrative gym image are fictional. Your interactions are saved to your account."}</LocalDataNote>
      </aside>
    </div>
  </div>;
}
