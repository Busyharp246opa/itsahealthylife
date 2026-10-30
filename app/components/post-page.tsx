import Link from "next/link";
import { getCircleData } from "../../lib/fitcircle-data";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { isOfflinePreview } from "../../lib/supabase/availability";
import { PostComposer } from "./post-composer";
import { LocalDataNote, PageHeader } from "./workspace-ui";

export async function PostPage({ space }: { space: "trainee" | "trainer" }) {
  const offline = await isOfflinePreview();
  const db = offline ? null : await createServerSupabaseClient();
  const { data: { user } } = db ? await db.auth.getUser() : { data: { user: null } };
  const signedIn = !!user && !user.is_anonymous;
  const data = signedIn ? await getCircleData(space) : { communities: [] };
  return <div className="fc-page fc-post-page">
    <PageHeader eyebrow="Create" title="Share what moves you." description="Post a photo, a short video, or a note to your Circle." />
    <div className="fc-post-page-layout"><section className="fc-panel"><h2>Create a post</h2>
      {!signedIn && !offline ? <div className="fc-post-auth-note"><strong>Start writing now.</strong><p>Sign in when you are ready to publish. Your text draft will be here when you return; choose your photo or video again after signing in.</p><div><Link href="/auth/login?post=1">Sign in</Link><Link href="/auth/register/trainee">Create an account</Link></div></div> : null}
      {offline ? <p className="fc-post-offline-note">Posting is unavailable in the offline preview.</p> : null}
      <PostComposer circleSpace={space} communities={data.communities} canPublish={signedIn} />
    </section><aside><h2>Keep it real</h2><p>Share your own training and ideas. Your post appears in the {space === "trainer" ? "Trainer" : "Trainee"} Circle after publishing.</p><LocalDataNote>Photos and videos are limited to 6 MB. Saved media stays private to the people allowed to see its Circle post.</LocalDataNote></aside></div>
  </div>;
}
