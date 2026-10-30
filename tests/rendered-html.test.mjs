import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";
import { createClient } from "@supabase/supabase-js";

const projectRoot = new URL("../", import.meta.url);
const projectPath = fileURLToPath(projectRoot);
const port = 43991;
let server;
let serverOutput = "";

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/today`);
      if (response.ok) return;
    } catch {
      // The production process is still binding its port.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Healthy Life production server did not become ready.\n${serverOutput}`);
}

before(async () => {
  server = spawn(
    process.execPath,
    [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "start", "-p", String(port), "-H", "127.0.0.1"],
    { cwd: projectPath, env: { ...process.env, NODE_ENV: "production" } },
  );
  server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
  server.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });
  await waitForServer();
});

after(() => server?.kill());

test("serves the Healthy Life landing page and story", async () => {
  for (const route of ["/", "/about"]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /IT’S A<br>HEALTHY LIFE/);
    assert.match(html, /href="\/auth\/register\/trainee"/);
    assert.doesNotMatch(html, /\/member\?auth=|\/experts\?auth=/);
  }
});

test("login accepts existing password lengths while registration keeps its eight-character rule", async () => {
  const login = await fetch(`http://127.0.0.1:${port}/auth/login`).then((response) => response.text());
  const loginPassword = login.match(/<input\b(?=[^>]*\bname="password")[^>]*>/i)?.[0];
  assert.ok(loginPassword, "login password input is rendered");
  assert.doesNotMatch(loginPassword, /\b(?:minlength|maxlength)=/i);

  const registration = await fetch(`http://127.0.0.1:${port}/auth/register/trainee`).then((response) => response.text());
  const newPassword = registration.match(/<input\b(?=[^>]*\bname="password")[^>]*>/i)?.[0];
  assert.ok(newPassword, "registration password input is rendered");
  assert.match(newPassword, /\bmaxlength="8"/i);
});

test("server-renders the populated Healthy Life Today overview", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/today`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Today · It’s A Healthy Life/i);
  assert.match(html, /Your next step starts here/);
  assert.doesNotMatch(html, /TDEE estimate|FitLoop/);
  assert.match(html, /Mobile primary navigation/);
  assert.match(html, /healthy-life-mark\.png/);
  assert.match(html, /Offline preview|Starting session/);
  assert.doesNotMatch(html, /Starter Project|react-loading-skeleton/i);
});

test("member home renders the social feed, coach tabs, and post actions", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/trainee`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Home · It’s A Healthy Life/i);
  assert.match(html, /Fitsphere coaches/);
  assert.match(html, /Coachsphere coaches/);
  assert.doesNotMatch(html, /FitLoop|href="\/fitloop"/);
  assert.match(html, /Share post by/);
  assert.match(html, /Comment/);
  assert.doesNotMatch(html, /Your clients\.|Shared with you|href="\/trainer\/clients"/);
});

test("member dashboard presents Healthy Life branding and working feature shortcuts", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/trainee/dashboard`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Dashboard · It’s A Healthy Life/i);
  assert.match(html, /IT’S A HEALTHY LIFE/);
  assert.doesNotMatch(html, /FitLoop/);
  for (const href of ["/circle", "/train", "/wellness#meals", "/store", "/my-plan", "/discover?category=live-class", "/calendar", "/badges", "/challenges", "/faceoff"]) {
    assert.ok(html.includes(`href="${href.replaceAll("&", "&amp;")}"`), `${href} dashboard shortcut`);
  }
});

test("FitLoop and TDEE routes are absent", async () => {
  for (const route of ["/fitloop", "/wellness/tdee"]) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 404, route);
  }
});

test("serves representative member, coach, wellness, commerce, and operator routes", async () => {
  const routes = [
    "/train/exercises",
    "/train/my-programs",
    "/calendar/schedules",
    "/more",
    "/trainee",
    "/trainee/dashboard",
    "/auth/admin",
    "/train/exercises/0001?lang=es",
    "/train/programs/foundation-strength",
    "/circle",
    "/my-plan",
    "/support",
    "/notifications",
    "/badges",
    "/referrals",
    "/discover",
    "/post",
    "/faceoff",
    "/discover?category=fitforum",
    "/circle/communities/strength-room",
    "/coaches/30000000-0000-4000-8000-000000000001",
    "/wellness",
    "/challenges",
    "/messages/80000000-0000-4000-8000-000000000001",
    "/calendar",
    "/store",
    "/settings?tab=privacy",
    "/settings?tab=subscription",
  ];

  for (const route of routes) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`);
    assert.equal(response.status, 200, `${route} should render`);
    assert.match(await response.text(), /<main/);
  }
});

test("trainer and admin shells require a role-bearing session", async () => {
  async function assertProtectedRoute(route, destination) {
    const response = await fetch(`http://127.0.0.1:${port}${route}`, { redirect: "manual" });
    if (response.status === 307) {
      assert.equal(new URL(response.headers.get("location"), response.url).pathname, destination);
      return;
    }
    assert.equal(response.status, 200, route);
    assert.match(await response.text(), new RegExp(`url=${destination}(?:["<]|$)`));
  }
  for (const route of ["/trainer", "/trainer/clients", "/trainer/plans", "/trainer/circle"]) {
    await assertProtectedRoute(route, "/auth/login");
  }
  for (const route of ["/admin", "/admin/overview", "/admin/support", "/admin/notifications"]) {
    await assertProtectedRoute(route, "/auth/admin");
  }
  const signIn = await fetch(`http://127.0.0.1:${port}/auth/admin`);
  assert.match(await signIn.text(), /Sign in to the admin panel/);
});

test("social hub navigation and Circle feed remain available", async () => {
  const trainee = await fetch(`http://127.0.0.1:${port}/circle`).then((response) => response.text());
  const traineeNav = trainee.match(/<nav class="fc-route-nav"[^>]*>(.*?)<\/nav>/)?.[1] ?? "";
  const destinations = ["/trainee", "/discover", "/post", "/messages", "/trainee/dashboard"];
  for (const [index, destination] of destinations.entries()) {
    assert.ok(traineeNav.includes(`href="${destination}"`), destination);
    if (index) assert.ok(traineeNav.indexOf(`href="${destinations[index - 1]}"`) < traineeNav.indexOf(`href="${destination}"`));
  }
  assert.match(trainee, /Trainee Circle/);
  assert.doesNotMatch(traineeNav, /href="\/faceoff"/);
  assert.doesNotMatch(traineeNav, />More<|href="\/more"/);
});

test("guest Post offers a real composer and sign-in publishing path", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/post`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Create a post/);
  assert.match(html, /What would you like to share with your Circle\?/);
  assert.match(html, /Photo or video/);
  assert.match(html, /Sign in to publish/);
  assert.match(html, /href="\/auth\/login\?post=1"/);
});

test("shows local saved-flow entry points and keeps protected admin actions gated", async () => {
  const [support, circle, admin] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/support`).then((response) => response.text()),
    fetch(`http://127.0.0.1:${port}/circle`).then((response) => response.text()),
    fetch(`http://127.0.0.1:${port}/auth/admin`).then((response) => response.text()),
  ]);
  assert.match(support, /Support conversations/);
  assert.match(circle, /Community guidelines/);
  assert.match(admin, /Sign in to the admin panel/i);
  assert.doesNotMatch(admin, /Send to all local users/);
});

test("shows workbook discovery categories and package terms without inventing catalog items or prices", async () => {
  for (const category of ["coaches", "people", "videos", "community", "fitforum", "challenges", "live-class", "faceoff"]) {
    const response = await fetch(`http://127.0.0.1:${port}/discover?category=${category}`);
    assert.equal(response.status, 200, `${category} category should render`);
  }
  const filtered = await fetch(`http://127.0.0.1:${port}/discover?category=coaches&q=Maya`);
  assert.equal(filtered.status, 200);
  const filteredHtml = await filtered.text();
  assert.match(filteredHtml, /Maya Nasser/);
  assert.match(filteredHtml, /1 result/);
  assert.doesNotMatch(filteredHtml, /Omar Khalid/);

  const discover = await fetch(`http://127.0.0.1:${port}/discover?category=fitforum`);
  assert.equal(discover.status, 200);
  const discoverHtml = await discover.text();
  assert.match(discoverHtml, /Healthy Life social hub/);
  assert.match(discoverHtml, /Search Healthy Life/);
  assert.match(discoverHtml, /Fit Forum/);
  assert.match(discoverHtml, /Face Off/);
  const liveClass = await fetch(`http://127.0.0.1:${port}/discover?category=live-class`).then((response) => response.text());
  assert.match(liveClass, /Catalog pending/);

  const packages = await fetch(`http://127.0.0.1:${port}/settings?tab=subscription`);
  assert.equal(packages.status, 200);
  const packageHtml = await packages.text();
  for (const name of ["Community Access", "Core Circle Access", "Full Circle Access", "Healthy Life+"]) assert.match(packageHtml, new RegExp(name.replace("+", "\\+")));
  assert.match(packageHtml, /3 live classes per month/);
  assert.match(packageHtml, /3 on-demand classes per week/);
  assert.match(packageHtml, /Price to be confirmed/);
  assert.match(packageHtml, /stacking rule pending/);
  assert.doesNotMatch(packageHtml, /Upgrade unavailable/);
});

test("keeps the exercise browser ahead of secondary training content", async () => {
  const response = await fetch(`http://127.0.0.1:${port}/train`);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.indexOf("Browse exercises") < html.indexOf("Starter sessions"));
  assert.match(html, /Search by exercise name/);
  assert.match(html, /upper arms/i);
  assert.match(html, /Create a program|My programs/);
  const [programs, schedule] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/train/my-programs`).then((result) => result.text()),
    fetch(`http://127.0.0.1:${port}/calendar/schedules`).then((result) => result.text()),
  ]);
  assert.match(programs, /Create seven-day program/);
  assert.match(schedule, /New exercise schedule/);
});

test("serves only a currently enabled read-only training schedule share link", async () => {
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8");
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const service = createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.SUPABASE_SERVICE_ROLE_KEY, options);
  const email = `schedule-share-${crypto.randomUUID()}@example.test`;
  const created = await service.auth.admin.createUser({ email, password: "Abcd1234", email_confirm: true });
  assert.ifError(created.error);
  try {
    const user = createClient(values.NEXT_PUBLIC_SUPABASE_URL, values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    const signed = await user.auth.signInWithPassword({ email, password: "Abcd1234" });
    assert.ifError(signed.error);
    const program = await user.from("trainee_programs").insert({ owner_id: created.data.user.id, title: "Shared week test" }).select("id").single();
    assert.ifError(program.error);
    const token = crypto.randomUUID();
    const schedule = await user.from("trainee_schedules").insert({ owner_id: created.data.user.id, title: "Read-only training week", program_id: program.data.id, starts_on: "2026-10-01", share_token: token }).select("id").single();
    assert.ifError(schedule.error);
    const shared = await fetch(`http://127.0.0.1:${port}/calendar/shared/${token}`);
    assert.equal(shared.status, 200);
    const html = await shared.text();
    assert.match(html, /Read-only training week/);
    assert.match(html, /Shared read-only schedule/);
    const followingWeek = await fetch(`http://127.0.0.1:${port}/calendar/shared/${token}?week=2026-10-26`);
    assert.equal(followingWeek.status, 200);
    assert.match(await followingWeek.text(), /Next week/);
    const revoked = await user.from("trainee_schedules").update({ share_token: null }).eq("id", schedule.data.id).select("share_token").single();
    assert.ifError(revoked.error);
    assert.equal(revoked.data.share_token, null);
    const afterRevocation = await fetch(`http://127.0.0.1:${port}/calendar/shared/${token}`);
    const revokedHtml = await afterRevocation.text();
    assert.doesNotMatch(revokedHtml, /Read-only training week/);
    assert.match(revokedHtml, /404|not found/i);
  } finally {
    await service.auth.admin.deleteUser(created.data.user.id);
  }
});

test("exposes the local catalog while denying guest access to private wellness rows", async () => {
  const envText = await readFile(new URL("../.env.local", import.meta.url), "utf8").catch(() => readFile(new URL("../.env.example", import.meta.url), "utf8"));
  const values = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).slice(0, 2)));
  const url = values.NEXT_PUBLIC_SUPABASE_URL;
  const key = values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(url && key, "local Supabase environment must be configured");

  const headers = { apikey: key };
  const catalog = await fetch(`${url}/rest/v1/exercise_catalog?select=id,category,instructions_by_locale,gif_path,media_attribution&limit=1`, { headers: { ...headers, Prefer: "count=exact" } });
  assert.ok([200, 206].includes(catalog.status));
  assert.equal(catalog.headers.get("content-range"), "0-0/1324");
  const [exercise] = await catalog.json();
  assert.ok(exercise.category);
  assert.ok(exercise.instructions_by_locale.en);
  assert.match(exercise.gif_path, /^videos\/.+\.gif$/);
  assert.match(exercise.media_attribution, /Gym visual/);

  const privateRows = await fetch(`${url}/rest/v1/wellness_checkins?select=id`, { headers });
  assert.ok([401, 403].includes(privateRows.status), "guest role must not read private wellness rows");
});

test("ships reproducible migrations, seeds, PWA metadata, and a retired legacy state route", async () => {
  const [migration, demoSeed, manifest, stateRoute] = await Promise.all([
    readFile(new URL("../supabase/migrations/20260717180000_fitcircle_core.sql", import.meta.url), "utf8"),
    readFile(new URL("../supabase/seeds/20_demo.sql", import.meta.url), "utf8"),
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../app/api/state/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(migration, /enable row level security/i);
  assert.match(migration, /create policy "users manage own checkins"/i);
  assert.match(demoSeed, /synthetic/i);
  assert.match(manifest, /"name": "It's A Healthy Life"/);
  assert.match(stateRoute, /status: 410/);
  await access(new URL("../supabase/seeds/10_exercises.sql", import.meta.url));

  const response = await fetch(`http://127.0.0.1:${port}/api/state`);
  assert.equal(response.status, 410);
});
