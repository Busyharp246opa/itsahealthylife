# Healthy Life hosted cutover

**Status (2026-10-30):** The Next.js Healthy Life app is live at https://itsahealthylife.vercel.app. The Supabase migration and exercise catalog load are complete. The original Auth users retain their IDs, and the former public and private schemas are archived. The Production server secret has been added to Vercel for subsequent deployments.

The hosted Supabase project is `jqtrzwiyeohcljdvfkss`. The original 14 migration versions are represented by placeholders in this repository, with their SQL retained under `legacy/healthy-life-vite/supabase/migrations/`. The 27 new versions were applied using `supabase db push --include-all`; hosted migration history now contains 41 versions.

## Backup and execution record

- Before migration, a logical dump of `public`, `private`, `auth`, `storage`, and `supabase_migrations` was saved outside the repository at `/home/okja/healthy-life-backup-20261030/`. It contains `schema.sql`, `data.sql`, and `roles.sql`, each readable only by the local owner. The hosted Free plan did not provide a managed project backup. The dump has not been restored into an isolated project, so recovery from it remains untested.
- Pre-cutover inventory: 2 Auth users, 2 profiles, 3 role grants, 1 training program, 3 products, 3 content items, 3 Circle rooms, 1 challenge with 7 steps, and no Storage objects. Other saved member activity tables were empty.
- The migration retained 2 Auth users, archived 2 profiles, 3 role grants, 1 training program, and 3 products, and mapped 2 new profiles including 1 `super_admin`, 1 trainee program with 1 movement, 3 products, 3 communities, 3 posts, and 1 challenge. No public FitLoop or TDEE tables remain.
- The 1,324-exercise catalog was loaded from `supabase/seeds/10_exercises.sql` in 14 idempotent batches. The single 17 MB file exceeded the hosted query endpoint's request size. `supabase/seeds/20_demo.sql` was not loaded in Production.
- Supabase Auth's Site URL was already the production origin. `https://itsahealthylife.vercel.app/auth/confirm` was added to its redirect allowlist and verified after a dashboard refresh. The three former app URLs remain on the list.
- Vercel is configured for Next.js; `39b13a1` was the first successful Production build, and `93b3952` is Ready with the login, wordmark, and static landing navigation fixes. Production has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_ORIGIN`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`.

## Verification and limits

- A clean isolated stack reset with all 41 migration files and the local exercise and demo seeds. A second isolated stack rehearsed all 14 original migrations, an account, and a saved training program before applying the 27 new migrations. The account signed in with its original password and read its mapped profile, program, and movement through owner-scoped policies.
- `npm run build` and 29 integration tests passed before the hosted migration. The new landing and login routes rendered in preview, and `/fitloop` and `/wellness/tdee` returned 404. The production landing was observed serving the new app.
- Hosted row counts and the admin role were verified through SQL after migration. An existing hosted member signed in and reached `/trainee` in Chrome on 2026-10-30. Operator sign-in and saved program reads still need a browser check; no account password was changed for this cutover.

## Follow-up smoke checks

The live landing, About, login, member home, catalog, legacy bookmark redirects, and FitLoop/TDEE 404s have been checked. The workspace wordmark is unboxed, and the member home opens the static landing page without the former RSC prefetch 404. Remaining browser checks are the existing member's saved program and social data, operator sign-in, and cross-role access. Restore the logical dump into an isolated project before relying on it as a tested recovery path.

## Recovery

If recovery is needed, stop writes first. Restore the pre-cutover logical dump into a replacement project and point the prior Vite deployment at it only after checking the restored schema and Auth users. The archived rows remain in the current database, but the old app cannot use the new public schema directly. A restore can discard writes made after the dump.
