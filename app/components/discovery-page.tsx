import Link from "next/link";
import { Clapperboard, Compass, MessageSquareText, Radio, Search, Swords, Trophy, UsersRound, type LucideIcon } from "lucide-react";
import { getChallenges, getCircleData, getCoaches } from "../../lib/fitcircle-data";
import { getFaceoffMatches } from "../../lib/faceoffs";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { isOfflinePreview } from "../../lib/supabase/availability";
import { DiscoveryCarousel, type DiscoveryCard } from "./discovery-carousel";
import { LocalDataNote, StatusBadge } from "./workspace-ui";

const categories: Array<{ id: string; label: string; icon: LucideIcon; hint: string }> = [
  { id: "coaches", label: "Coaches", icon: Compass, hint: "Find guidance" },
  { id: "people", label: "Other users", icon: UsersRound, hint: "Meet members" },
  { id: "videos", label: "Videos", icon: Clapperboard, hint: "Watch clips" },
  { id: "community", label: "Community", icon: UsersRound, hint: "Find a room" },
  { id: "fitforum", label: "Fit Forum", icon: MessageSquareText, hint: "Read questions" },
  { id: "challenges", label: "Challenges", icon: Trophy, hint: "Join a goal" },
  { id: "live-class", label: "Live class", icon: Radio, hint: "Classes soon" },
  { id: "faceoff", label: "Face Off", icon: Swords, hint: "Challenge someone" },
];
type Result = { id: string; category: string; title: string; detail: string; href: string; score?: number };

export async function DiscoveryPage({ searchParams, space }: {
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
  space: "trainee" | "trainer";
}) {
  const { category: rawCategory, q: rawQuery } = await searchParams;
  const requested = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const category = categories.some((item) => item.id === requested) ? requested! : "all";
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery ?? "").trim().slice(0, 100);
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const basePath = space === "trainer" ? "/trainer" : "";
  const [coaches, circle, challenges, faceoffs, peopleResult, communityResult] = await Promise.all([
    getCoaches(), offline || (user && !user.is_anonymous) ? getCircleData(space) : Promise.resolve({ posts: [], people: [], communities: [] }), getChallenges(), getFaceoffMatches(space),
    db ? db.from("profiles").select("id,handle,display_name,headline,role,is_verified").eq("is_public", true).limit(100) : Promise.resolve({ data: null }),
    db && space === "trainee" ? db.from("communities").select("id,slug,name,description,member_count").eq("is_private", false).order("member_count", { ascending: false }).limit(50) : Promise.resolve({ data: null }),
  ]);
  const people = peopleResult.data ?? (offline ? circle.people : []);
  const communities = space === "trainer"
    ? [{ id: "trainer-circle", slug: "trainer-circle", name: "Trainer Circle", description: "Coaching ideas and questions from approved trainers.", member_count: 0 }]
    : communityResult.data ?? (offline ? circle.communities : []);
  const results: Result[] = [
    ...coaches.map((coach) => ({ id: coach.id, category: "coaches", title: coach.profiles?.display_name ?? "Coach", detail: coach.specialties.join(" · ") || coach.coaching_type, href: "/coaches/" + coach.id, score: coach.review_count })),
    ...people.map((person) => ({ id: person.id, category: "people", title: person.display_name, detail: person.headline, href: "/people/" + person.handle })),
    ...circle.posts.filter((post) => post.media_type?.startsWith("video/")).map((post) => ({ id: post.id, category: "videos", title: post.body || "Video from " + (post.profiles?.display_name ?? "Healthy Life"), detail: "Short clip · " + (post.profiles?.display_name ?? "Member"), href: basePath + "/circle#post-" + post.id, score: post.reaction_count })),
    ...communities.map((community) => ({ id: community.id, category: "community", title: community.name, detail: community.description, href: space === "trainer" ? "/trainer/circle" : "/circle/communities/" + community.slug, score: community.member_count })),
    ...circle.posts.filter((post) => post.kind === "question").map((post) => ({ id: post.id, category: "fitforum", title: post.title || post.body, detail: "Question in " + (space === "trainer" ? "Trainer Circle" : "Trainee Circle"), href: basePath + "/circle#post-" + post.id, score: post.comment_count })),
    ...challenges.filter((challenge) => !challenge.slug.includes("faceoff")).map((challenge) => ({ id: challenge.id, category: "challenges", title: challenge.name, detail: challenge.description, href: "/challenges", score: challenge.participant_count })),
    ...faceoffs.filter((match) => match.status === "open").map((match) => ({ id: match.id, category: "faceoff", title: match.goal, detail: "Open challenge · target " + match.target_date, href: basePath + "/faceoff" })),
  ];
  const choices = user && !user.is_anonymous && db ? await db.from("member_discovery_choices").select("tag_id").eq("owner_id", user.id) : null;
  const tagIds = (choices?.data ?? []).map((choice) => choice.tag_id);
  const tags = tagIds.length && db ? await db.from("discovery_tags").select("label,priority").in("id", tagIds).eq("is_active", true) : null;
  function rank(item: Result) {
    const personalization = (tags?.data ?? []).reduce((total, tag) => {
      const words = tag.label.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length >= 3);
      return total + (words.some((word) => (item.title + " " + item.detail).toLocaleLowerCase().includes(word)) ? tag.priority + 1 : 0);
    }, 0);
    return personalization + (item.score ?? 0);
  }
  const sorted = results.sort((a, b) => rank(b) - rank(a));
  const terms = query.toLocaleLowerCase();
  const matches = sorted.filter((item) => (category === "all" || item.category === category) && (!terms || (item.title + " " + item.detail).toLocaleLowerCase().includes(terms)));
  const featured: DiscoveryCard[] = categories.flatMap((entry) => {
    const group = sorted.filter((item) => item.category === entry.id);
    return group.length ? [{ category: entry.label, title: group[0].title, detail: group[0].detail, href: group[0].href, count: group.length }] : [];
  });
  const selectedLabel = categories.find((item) => item.id === category)?.label ?? "All results";
  return <div className="fc-page fc-discover-page fc-discovery-hub">
    <div className="fc-discovery-intro"><span>Healthy Life social hub</span><h1>Find your people. Find your next move.</h1><p>Search coaches, members, posts, challenges, and more across Healthy Life.</p></div>
    <form action={basePath + "/discover"} method="get" className="fc-global-search">
      {category !== "all" ? <input type="hidden" name="category" value={category} /> : null}
      <Search size={22} aria-hidden /><label className="sr-only" htmlFor="fc-global-query">Search Healthy Life</label><input id="fc-global-query" name="q" type="search" defaultValue={query} maxLength={100} placeholder="Search Healthy Life…" autoComplete="off" /><button type="submit">Search</button>
    </form>
    <DiscoveryCarousel cards={featured} />
    <section className="fc-discovery-categories" aria-label="Search categories"><div className="fc-discovery-section-title"><div><span>Browse by interest</span><h2>What are you looking for?</h2></div>{category !== "all" ? <Link href={basePath + "/discover" + (query ? "?q=" + encodeURIComponent(query) : "")}>View all</Link> : null}</div>
      <nav>{categories.map(({ id, label, icon: Icon, hint }) => <Link key={id} href={basePath + "/discover?category=" + id + (query ? "&q=" + encodeURIComponent(query) : "")} className={category === id ? "is-current" : ""} aria-current={category === id ? "page" : undefined}><span><Icon size={23} aria-hidden /></span><strong>{label}</strong><small>{hint}</small></Link>)}</nav>
    </section>
    <section className="fc-panel fc-discovery-results"><div className="fc-discover-summary"><div><span>{query ? "Search results" : "Explore"}</span><h2>{selectedLabel}</h2></div><StatusBadge>{category === "live-class" ? "Catalog pending" : matches.length + " " + (matches.length === 1 ? "result" : "results")}</StatusBadge></div>
      {category === "live-class" ? <p>Live classes are not available to book yet.</p> : matches.length ? <div className="fc-discover-results">{matches.slice(0, 80).map((item) => <Link href={item.href} key={item.category + "-" + item.id}><small>{categories.find((entry) => entry.id === item.category)?.label}</small><strong>{item.title}</strong><span>{item.detail}</span><span aria-hidden>→</span></Link>)}</div> : <p>No matching content yet. Try another word or category.</p>}
    </section>
    <LocalDataNote>Fictional seed profiles and activity may appear in preview. Search includes public catalog content and Circle posts visible to your role; it does not search private messages or wellness data.</LocalDataNote>
  </div>;
}
