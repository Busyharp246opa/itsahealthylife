# Healthy Life hosted cutover

**Status:** prepared and locally rehearsed; hosted schema cutover is pending. Commit `7be5222` failed on Vercel because the project still expected Vite's `dist` folder. Root `vercel.json` now declares the Next.js framework and `.next` output. Check the replacement build, environment, and live site before any database change.

The hosted Supabase project is `jqtrzwiyeohcljdvfkss`. Its original 14 migration versions are represented by placeholder files in the current `supabase/migrations/` directory; the original SQL remains in `legacy/healthy-life-vite/supabase/migrations/`. This keeps local and hosted migration history aligned. The new migration chain uses `--include-all` because some new versions predate the original hosted versions.

## Verified on 2026-10-30

- A clean isolated stack resets with all 41 migration files and the local exercise/demo seeds.
- A second isolated stack ran all 14 original migrations, created an account and saved training program, then applied all 27 new migrations. The old rows remained in `healthy_legacy`, while the new public schema held one mapped account, one program and movement, three products, three library posts, three communities, and one challenge.
- The mapped account signed in with its original password and could read its new profile, program, and movement through owner-scoped API policies.
- `npm run build` and 29 integration tests passed. The rendered app exposes neither FitLoop nor TDEE routes.

The hosted inventory at review time was 2 Auth users, 2 profiles, 3 role grants, 1 training program, 3 products, 3 content items, 3 Circle rooms, 1 challenge with 7 steps, and no Storage objects. All other saved member activity tables were empty. Recheck these counts immediately before cutover.

## Before changing the hosted project

1. Secure a restorable database backup or logical dump and record the restore point. Supabase documents its backup and logical dump options at https://supabase.com/docs/guides/platform/backups. The archive migration preserves old rows, but a backup is still required for recovery from an incomplete cutover.
2. Arrange a short write freeze, because old and new applications use incompatible public schemas. Record counts of `auth.users` and all old public tables.
3. Ensure access to the actual Vercel project and its environment settings. The currently connected Vercel MCP account does not see `itsahealthylife`; the user’s old browser project tab also returned 404. Do not migrate the hosted database until the replacement deployment can be configured and launched.
4. Confirm hosted Auth redirect URLs cover the new `/auth/confirm` and password recovery routes at the production origin.

## Ordered cutover

1. Link the Supabase CLI to `jqtrzwiyeohcljdvfkss` with an authorized account. Review `supabase db push --include-all --dry-run`; it should list only the 27 new migration versions. Do not use `db reset --linked` or `--include-seed` on production.
2. Apply `supabase db push --include-all`. The first new migration archives the original public tables/functions and private schema. The final new migration maps compatible records to the new schema. Auth users and their IDs remain in place.
3. Load the **exercise catalog only** with `supabase db query --linked --file supabase/seeds/10_exercises.sql`. Do not load `20_demo.sql` on production; it contains fictional accounts and product data.
4. Verify archived counts match the pre-cutover counts; confirm 2 mapped profiles, the admin role, saved training program/day/movement, 3 products, 3 library posts, 3 communities, 1 challenge, and 1,324 exercises. Confirm no FitLoop tables.
5. Configure the Vercel project for Next.js at repository root. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_ORIGIN=https://itsahealthylife.vercel.app`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. Deploy the reviewed revision.
6. Smoke test landing/About, member sign-in, existing admin sign-in, saved program, social, exercise catalog, store, and trainer access. Check `/fitloop` and `/wellness/tdee` return 404. Resume writes after these checks.

## Recovery

If a cutover step fails, keep writes paused. Restore the recorded pre-cutover database backup and redeploy the previous Vite revision. The original rows also remain archived after a successful archive migration, but the old app cannot run against the new public schema without a database restore or separately reviewed reversal. A database restore can discard writes made after the restore point, so the write freeze is part of the cutover.
