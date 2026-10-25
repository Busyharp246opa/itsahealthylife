# It’s a Healthy Life

Source repository: https://github.com/Busyharp246opa/itsahealthylife

A responsive member app, expert workspace, and admin console based on the supplied platform spec, workbook, logos, and Figma screens. The app has two modes: a seeded local walkthrough in browser storage and a connected Supabase mode backed by shared records and row level security.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open <http://127.0.0.1:5173/>. The local walkthrough works without credentials. For connected mode, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. The current workspace already has a local, ignored `.env.local` for the HealthyLife project. Never put a service role key in a Vite variable.

For the three desktop design concepts, open <http://127.0.0.1:5173/Sample%20UI/index.html>. You can also open `Sample UI/index.html` directly from the project folder; its links target each concept's `index.html` rather than a directory. Daily Workbench now includes clickable program details, full exercise browsing, illustrative animated exercise previews, technique details, add-to-day targets, and an expert sharing preview. These concept actions stay in memory and never write to Supabase. Its member desktop navigation has also been adapted into the React app, with role-scoped Find a feature search (Ctrl/Cmd+K); the existing admin panel keeps its UI. Browser Back and Forward now follow workspace pages and the training catalog, including its filters. Design rationale is in `Sample UI/DESIGN.md`.

On the mobile member demo, use the green **Live** button in the purple top bar to switch to **Live Supabase**. The demo role selector only previews local sample data and does not authenticate. Create or sign in to an account there. The confirmed account `itsahealthylifeltd@gmail.com` has the first admin grant; refresh after signing in to load it. Any signed-in member can choose **Apply as expert**. An admin must approve the submitted application before the expert appears in discovery or can be booked.

## What works

- Member: account creation/sign-in/reset, health profile and sharing choice, expert discovery, available slots, simulated booking/cancellation, booking-linked messages, meal and activity logs, **member-authored weekly training programs with a 1,324-item searchable and filtered exercise browser, technique details, target sets/reps, per-set rep and weight logging, completion history, one active program, and optional sharing with a booked expert**, reviewed library saves, challenge steps, member Circle rooms and posts, likes, comments, reports, blocks, and people views, shop orders, and support requests.
- Expert: application and review status, availability, assigned bookings/clients, read-only member-shared training programs, messages, a separate approved-expert Circle, content drafts, and linked simulated earnings.
- Admin: expert review, booking/payment/payout overview, content publication, challenge and product creation, support/report queues, booking policy versions, and audit activity.
- Local demo: prefilled walkthrough for all three roles. Demo data stays in browser storage and is separate from Supabase.

Checkout and shop orders are **simulated**. No card is charged, no funds move, and no external payment provider is configured.

Confirmed booking messages support one image or document attachment per message (up to 10 MB). Demo files stay in browser IndexedDB; Live Supabase files use a private Storage bucket that only the booked member and expert can access while the booking is confirmed.

Member **Track** has compact nutrition and movement totals, a quick meal/activity form, optional macros, and repeat/remove controls in today's log. The same page works in local demo and Live Supabase modes.

## Backend

The `HealthyLife` Supabase MCP targets project `jqtrzwiyeohcljdvfkss`. SQL migrations live in `supabase/migrations/`; the deployed `platform-api` Edge Function is in `supabase/functions/platform-api/index.ts`. The browser uses a publishable key and user JWT. Row level security limits reads and direct writes; the Edge Function checks roles and performs privileged state transitions. The database has separate booking, payment, payout, and audit records. All 34 public tables have RLS enabled. Training rows have member ownership policies; an expert sees a program and its logs only while the member shares it and a confirmed or completed booking connects them.

The exercise finder uses 1,324 English text records adapted from the local FitCircle repository. Provenance and the MIT license are in `public/data/README.md` and `public/data/exercises-LICENSE.txt`. FitCircle's separately licensed exercise images and GIFs were not copied. Flow Exercise Dataset SVG previews are now included for 1,257 exercises, with instructions-only fallbacks for 67. Artwork attribution and limitations are in `public/data/README.md`; the visuals are illustrative and have not received a rights or form-accuracy review.

If the MCP token expires, run `codex mcp login HealthyLife` and approve the OAuth flow. The project `.mcp.json` contains the MCP URL but no credentials.

## Verify

```bash
npm run build
```

The local walkthrough has been exercised in a browser from expert selection through confirmed simulated booking. The Circle member/expert feeds, room navigation, posting, report-to-admin moderation, mobile layout, and exercise-detail Back navigation were checked in a local browser. A rolled-back authenticated SQL test created a Circle post, like, and comment with no persistent records; all 34 public tables have RLS. Daily Workbench and the React training studio were exercised in a browser at desktop and phone widths. Rolled-back SQL checks created a training program, set log, and completed session under an authenticated member, switched the active program atomically, and confirmed another signed-in identity could not see the program. No test records persisted. The connected sign-in screen loads, and the first admin confirmed that the live Platform overview opens. The deployed function responds to local CORS preflight and rejects unauthenticated POST requests. The Supabase security advisor currently reports one Auth warning: leaked-password protection is disabled (a Pro-plan feature). There are no table/RLS security findings. See `docs/ai/40-flows.yaml` for flow-specific smoke checks.

## Scope still requiring integrations

The product spec’s real payment provider, calls, media uploads, calendar sync, notification delivery, advanced food search, charts, and social publishing need additional integration and policy decisions. The current build is suitable for local review and connected workflow testing; it is not a production commerce or telehealth release.
