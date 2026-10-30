# It’s A Healthy Life

A Next.js implementation of the FitCircle product, adapted to the existing Healthy Life brand. It includes member, trainer, community, training, wellness, store preview, and operator workflows. FitLoop and the TDEE calculator are excluded. The original Healthy Life Vite app and its architecture docs are preserved in `legacy/healthy-life-vite/`.

## Local development

Requires Node.js 22.13+ and Docker. This project uses its own Supabase stack on ports 57320–57329 and Next.js on port 3390, separate from the FitCircle development stack.

```bash
npm ci
DOCKER_HOST=unix:///run/user/1000/docker.sock npm run supabase:start
DOCKER_HOST=unix:///run/user/1000/docker.sock npm run db:reset
```

Copy `.env.example` to `.env.local`. Fill `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `supabase status -o env`; keep the service role key server only. Then run `npm run dev:web` and open `http://127.0.0.1:3390/`. If Docker is not rootless on your machine, omit `DOCKER_HOST`.

```bash
npm run build
node --test tests/*.test.mjs
```

The local reset runs the schema migrations and seeds the exercise catalog and demo content. The public landing page and About page use the original Healthy Life design, logo, Host and Bricolage fonts, and plum, lime, lavender, and warm-white palette. Workspace routes start at `/trainee`, `/trainer`, and `/admin`; auth routes are under `/auth`.

## Supabase and existing data

The `HealthyLife` Supabase MCP is configured in `.mcp.json` for project `jqtrzwiyeohcljdvfkss` and its OAuth login was verified on 2026-10-30. The hosted database remains on the original schema. The production site must be checked after a `main` push because Vercel may deploy automatically.

The hosted project contains existing Auth users and original Healthy Life tables. The ordered migrations in `supabase/migrations/` first archive the old public and private schemas as `healthy_legacy` and `healthy_legacy_private`, then create the new app schema, and finally map existing accounts, roles, Circle rooms, products, challenge, library items, guidelines, and saved training program. Original rows remain in the archived schemas, including data without a direct new-model counterpart. A representative local rehearsal passed, including sign-in to a migrated account. The hosted cutover still requires a database backup, ordered migration application, hosted environment and Auth redirect updates, deployment, and role/data smoke checks. See `CUTOVER.md` for the reviewed sequence and `docs/ai/` for architecture.

The old Vite architecture and its original docs are at `legacy/healthy-life-vite/docs/ai/`. `Sample UI/` contains design source and concepts. Exercise text provenance and media limits are in `public/data/README.md`.

## Product boundaries

The store, pricing, wallet, live class, and some scheduling screens are previews. They do not charge cards or fulfill orders. Saved social and training operations use Supabase Auth, server checks, and row level security. The service role key must never be exposed to the browser.
