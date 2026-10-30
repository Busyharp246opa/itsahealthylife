export type SearchArea = "Trainee" | "Trainer" | "Admin" | "Account";

export type FeatureSearchEntry = {
  href: string;
  title: string;
  description: string;
  area: SearchArea;
  keywords: string;
};

export const featureSearchEntries: FeatureSearchEntry[] = [
  { href: "/trainee", title: "Home feed", description: "Public coach and community posts", area: "Trainee", keywords: "home social feed fitsphere coachsphere dashboard" },
  { href: "/trainee/dashboard", title: "Dashboard", description: "Your training and feature shortcuts", area: "Trainee", keywords: "home menu activity rings apps tiles shortcuts" },
  { href: "/today", title: "Training overview", description: "Your next session and daily plan", area: "Trainee", keywords: "today dashboard workout start" },
  { href: "/train", title: "Training", description: "Build weekly programs and browse exercises", area: "Trainee", keywords: "workout exercise lift fitness" },
  { href: "/train/my-programs", title: "My weekly programs", description: "Plan each day with catalog or custom exercises", area: "Trainee", keywords: "create custom program routine week monday tuesday exercise training" },
  { href: "/train/exercises", title: "Exercise library", description: "Find movements by name, muscle, or equipment", area: "Trainee", keywords: "exercise search movement technique muscle equipment catalog" },
  { href: "/train/programs", title: "Training programs", description: "Explore multiweek training plans", area: "Trainee", keywords: "program plan schedule routine" },
  { href: "/train/workouts", title: "My workouts", description: "Start, log, and review sessions", area: "Trainee", keywords: "workout session set reps weight progress training log" },
  { href: "/my-plan", title: "My plan", description: "Read training, diet, and recovery guidance from your trainer", area: "Trainee", keywords: "client plan coach training diet nutrition recovery wellness guidance" },
  { href: "/calendar", title: "Schedule", description: "See your selected weekly exercise program", area: "Trainee", keywords: "calendar appointment booking date time coach workout" },
  { href: "/calendar/schedules", title: "My schedules", description: "Choose a program to follow and share its week", area: "Trainee", keywords: "create schedule follow program share link weekly planner" },
  { href: "/messages", title: "Chat", description: "Read conversations and send attachments", area: "Trainee", keywords: "messages chat inbox conversation direct message file attachment paperclip" },
  { href: "/post", title: "Create a post", description: "Share a photo, short video, or note", area: "Trainee", keywords: "plus upload camera capture photo video media instagram post" },
  { href: "/faceoff", title: "Face Off", description: "Invite someone or find an open challenge", area: "Trainee", keywords: "challenge friend opponent competition face off" },
  { href: "/wellness", title: "Wellness", description: "Your readiness, food, and reflections", area: "Trainee", keywords: "health mood sleep meal journal check in" },
  { href: "/wellness#readiness", title: "Daily check-in", description: "Record mood, energy, soreness, and sleep", area: "Trainee", keywords: "readiness wellness mood energy sleep soreness checkin" },
  { href: "/wellness#meals", title: "Meal log", description: "Add food and review meal history", area: "Trainee", keywords: "food calories kcal breakfast lunch dinner diet nutrition macros eat" },
  { href: "/wellness#journal", title: "Private journal", description: "Write and review personal reflections", area: "Trainee", keywords: "diary reflection note journal wellness" },
  { href: "/insights", title: "Progress insights", description: "See charts and activity trends", area: "Trainee", keywords: "analytics chart history statistics progress trends" },
  { href: "/circle", title: "Trainee Circle", description: "Post, comment, and like with other trainees", area: "Trainee", keywords: "circles community social feed post comment like people friends group" },
  { href: "/discover", title: "Discover", description: "Search coaches, users, communities, challenges and FaceOffs", area: "Trainee", keywords: "search filter coach people video community fitforum challenge live class faceoff" },
  { href: "/coaches", title: "Find a coach", description: "Discover trainers and request coaching", area: "Trainee", keywords: "trainer coach discovery booking hire personal training" },
  { href: "/challenges", title: "Challenges", description: "Browse activity challenges and rewards", area: "Trainee", keywords: "competition goal challenge leaderboard reward" },
  { href: "/badges", title: "Badges", description: "See local awards and available badges", area: "Trainee", keywords: "recognition tier bronze silver gold achievement" },
  { href: "/store", title: "Store", description: "Explore products and member rewards", area: "Trainee", keywords: "shop product buy merchandise coins" },
  { href: "/more", title: "All trainee features", description: "Browse every member destination", area: "Trainee", keywords: "more menu navigation features" },
  { href: "/trainer", title: "Trainer today", description: "Your clients and next steps", area: "Trainer", keywords: "coach dashboard home clients attention" },
  { href: "/trainer/circle", title: "Trainer Circle", description: "Post, comment, and like with other trainers", area: "Trainer", keywords: "circles coach community social feed post comment like" },
  { href: "/trainer/clients", title: "Trainer clients", description: "View clients who share their information", area: "Trainer", keywords: "coach trainee roster fitness diet wellness shared profile" },
  { href: "/trainer/plans", title: "Client plans", description: "Update training, diet, and recovery guidance for shared clients", area: "Trainer", keywords: "coach plan workout routine diet nutrition recovery client" },
  { href: "/trainer/exercises", title: "Exercise library", description: "Find movements and technique guides", area: "Trainer", keywords: "exercise search movement technique muscle equipment catalog" },
  { href: "/trainer/schedule", title: "Trainer schedule", description: "Explore the session planning preview", area: "Trainer", keywords: "coach calendar booking appointment availability" },
  { href: "/trainer/messages", title: "Trainer chat", description: "Read conversations and send attachments", area: "Trainer", keywords: "coach messages chat inbox conversation client" },
  { href: "/trainer/discover", title: "Trainer search", description: "Search people, coaches, posts, and challenges", area: "Trainer", keywords: "search discover users videos community fitforum live class faceoff" },
  { href: "/trainer/post", title: "Create a trainer post", description: "Share a photo, short video, or note with trainers", area: "Trainer", keywords: "plus upload camera capture photo video media post" },
  { href: "/trainer/faceoff", title: "Trainer Face Off", description: "Invite a trainer or find an open challenge", area: "Trainer", keywords: "challenge friend opponent competition face off" },
  { href: "/trainer/more", title: "All trainer features", description: "Browse trainer tools and references", area: "Trainer", keywords: "coach menu navigation features" },
  { href: "/settings?tab=profile", title: "Profile and preferences", description: "Edit fitness, diet, wellness, and coaching choices", area: "Account", keywords: "profile account personal details goals food training opt in" },
  { href: "/settings?tab=profile", title: "Interests and prompts", description: "Choose topics that shape public discovery order", area: "Account", keywords: "interests preferences questions topics ranking search" },
  { href: "/settings?tab=profile", title: "Share with my trainer", description: "Choose a trainer and control data sharing", area: "Account", keywords: "privacy consent sharing fitness diet wellness revoke coach client" },
  { href: "/settings?tab=notifications", title: "Notifications", description: "Set your reminder preferences", area: "Account", keywords: "alerts email push reminders" },
  { href: "/settings?tab=privacy", title: "Privacy and consent", description: "Review personal data consent choices", area: "Account", keywords: "data sharing security permissions marketing" },
  { href: "/settings?tab=subscription", title: "Access packages", description: "Compare Community, Core, Full and Healthy Life+ rules", area: "Account", keywords: "subscription membership premium billing fitcoin live class on demand price" },
  { href: "/settings?tab=support", title: "Support", description: "Find product and local setup help", area: "Account", keywords: "help contact troubleshooting" },
  { href: "/support", title: "Support tickets", description: "Open and track local help conversations", area: "Account", keywords: "help ticket contact reply case" },
  { href: "/notifications", title: "Notification inbox", description: "Read local in-app messages", area: "Account", keywords: "alerts inbox announcement message" },
  { href: "/referrals", title: "Referrals", description: "Create or enter a local invitation code", area: "Account", keywords: "invite share code friend attribution" },
  { href: "/settings?tab=legal", title: "Legal notices", description: "Review health and synthetic data notices", area: "Account", keywords: "terms policy disclaimer" },
  { href: "/settings?tab=data", title: "Download or delete my data", description: "Export your data or manage your account", area: "Account", keywords: "export json download erase remove deletion privacy account" },
  { href: "/auth/login", title: "Sign in", description: "Log in to your Healthy Life account", area: "Account", keywords: "login password remember me credentials" },
  { href: "/auth/change-password", title: "Replace temporary password", description: "Set a new password after trainer provisioning", area: "Account", keywords: "trainer coach first login credentials security" },
  { href: "/auth/register/trainee", title: "Trainee registration", description: "Create a trainee account", area: "Account", keywords: "sign up join member register coaching" },
  { href: "/auth/register/trainer", title: "Trainer application", description: "Apply to coach and optionally upload certificates", area: "Account", keywords: "coach sign up registration certificate approval" },
  { href: "/admin/overview", title: "Admin overview", description: "Review operational queues", area: "Admin", keywords: "operator dashboard management" },
  { href: "/auth/admin", title: "Admin sign in", description: "Sign in with an operator account", area: "Admin", keywords: "operator login credentials password" },
  { href: "/admin/trainers", title: "Trainer onboarding", description: "Review applications or directly add trainers", area: "Admin", keywords: "approve reject certificate invite provision credentials coach" },
  { href: "/admin/reports", title: "Reports and cases", description: "Review moderation cases", area: "Admin", keywords: "flag abuse case safety moderation" },
  { href: "/admin/post-reports", title: "Member post reports", description: "Review real local post reports", area: "Admin", keywords: "flag report community moderation safety" },
  { href: "/admin/support", title: "Support queue", description: "Reply to local member tickets", area: "Admin", keywords: "help ticket reply case" },
  { href: "/admin/guidelines", title: "Community guidelines", description: "Edit published conduct rules", area: "Admin", keywords: "policy safety rules community" },
  { href: "/admin/interests", title: "Interests and prompts catalog", description: "Manage discovery topics and priority", area: "Admin", keywords: "interests questions prompts search ranking" },
  { href: "/admin/badges", title: "Badge administration", description: "Create and manually award badges", area: "Admin", keywords: "recognition award tier achievement" },
  { href: "/admin/spotlight", title: "Coach spotlight", description: "Promote verified coaches locally", area: "Admin", keywords: "banner promote feature coach" },
  { href: "/admin/referrals", title: "Referral tracking", description: "Review local codes and attributions", area: "Admin", keywords: "invite code friend reward" },
  { href: "/admin/feature-flags", title: "Feature flags", description: "Review or change platform switches", area: "Admin", keywords: "toggle configuration rollout" },
  { href: "/admin/exercises", title: "Exercise catalog", description: "Inspect imported movement coverage", area: "Admin", keywords: "catalog import training library" },
  { href: "/admin/more", title: "All admin areas", description: "Browse every operations section", area: "Admin", keywords: "operator menu navigation" },
];

const adminSections: Array<[string, string, string]> = [
  ["members", "Members", "users accounts people"], ["coaches", "Coaches", "trainers verification"],
  ["fitspheres", "Fitspheres", "groups coaching"], ["content", "Content", "posts publishing"],
  ["programs", "Programs", "training plans"], ["community", "Community", "social groups"],
  ["appeals", "Appeals", "moderation review"], ["challenges", "Challenges", "competitions"],
  ["bookings", "Bookings", "appointments schedules"], ["payments", "Payments", "billing transactions"],
  ["coins", "Coins", "rewards ledger"], ["notifications", "Notifications", "alerts delivery"],
  ["audit-log", "Audit log", "operator changes events"], ["data-requests", "Data requests", "export correction deletion privacy"],
  ["system-status", "System status", "database auth realtime health"], ["settings", "Admin settings", "operator configuration"],
];

for (const [slug, title, keywords] of adminSections) {
  featureSearchEntries.push({ href: `/admin/${slug}`, title, description: `Open ${title.toLowerCase()} administration`, area: "Admin", keywords });
}

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchFeatures(query: string, area: SearchArea, limit = 12): FeatureSearchEntry[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) {
    const picks = area === "Trainer"
      ? ["/trainer/discover", "/trainer/post", "/trainer/faceoff", "/trainer/messages", "/trainer", "/trainer/clients"]
      : area === "Admin"
        ? ["/admin/overview", "/admin/trainers", "/admin/reports", "/admin/feature-flags", "/admin/exercises", "/admin/more"]
        : ["/discover", "/post", "/faceoff", "/messages", "/trainee/dashboard", "/trainee", "/circle", "/train"];
    return picks.map((href) => featureSearchEntries.find((entry) => entry.href === href)!).slice(0, limit);
  }
  return featureSearchEntries
    .map((entry, index) => {
      const title = normalize(entry.title);
      const description = normalize(entry.description);
      const keywords = normalize(entry.keywords);
      if (area === "Trainer" && (entry.href === "/coaches" || entry.href === "/discover" || entry.href === "/circle")) return null;
      if (area === "Trainee" && entry.href.startsWith("/trainer")) return null;
      if (!terms.every((term) => `${title} ${description} ${keywords}`.includes(term))) return null;
      let score = entry.area === area ? 6 : 0;
      const phrase = terms.join(" ");
      if (title === phrase) score += 90;
      else if (title.startsWith(phrase)) score += 55;
      for (const term of terms) {
        if (title.split(" ").some((word) => word.startsWith(term))) score += 24;
        else if (title.includes(term)) score += 12;
        else if (keywords.split(" ").some((word) => word.startsWith(term))) score += 8;
        else if (description.includes(term)) score += 3;
      }
      return { entry, score, index };
    })
    .filter((result): result is { entry: FeatureSearchEntry; score: number; index: number } => result !== null)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
