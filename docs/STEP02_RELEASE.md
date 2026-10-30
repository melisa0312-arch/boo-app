# Step 02 — review and safe hosted update

This document is a release procedure, not an instruction to deploy automatically. The existing Vercel site, protection settings and hosted Supabase accounts are not changed by local development. Do not reset a database, reseed a hosted project, upload environment files, or run opt-in local-account tests against hosted Supabase.

## Review the preview branch

Review `preview` against `main` in the existing repository. Verify the application changes, new SQL, generated types, updated decisions, validation evidence and screenshots. `vercel.json` remains unchanged with Git deployments disabled. No migration is part of `npm ci` or `npm run build`. Do not merge or deploy Production until the migration/Preview check below is complete and you approve a Production release.

The new files to apply are **only**:

1. `supabase/migrations/202610300003_personalization_and_match.sql`
2. `supabase/migrations/202610300004_internal_concept_catalog.sql`

Do not replay the foundation migrations (`001`/`002`) on an existing schema. They are retained unchanged. Migration `003` adds columns, checks, new tables, policies, functions and grants. It preserves existing `interests`, names, accounts, membership, invitations and sessions. New answer objects begin empty; existing users are not falsely marked onboarded. Migration `004` inserts 24 generic concepts, with no personal preferences or real venues.

## First use a separate staging database

Create or use a separate Supabase testing project and apply the foundation plus Step 02 migrations in order there. Configure only the protected Vercel Preview environment to point to that test project while checking a release. Existing Production environment values and data stay unchanged. Do not copy real profile contents or production credentials into the repository or synthetic tests.

Local validation uses Docker and disposable synthetic users. The API/browser test suites explicitly reject non-loopback targets. For hosted staging, perform a deliberate manual smoke check with test accounts you control; do not bypass the test safety guard.

## Before applying to the existing hosted Supabase project

1. Confirm the project identity in the Supabase Dashboard and record the currently deployed app version. Verify a restorable backup appropriate to your plan. Keep the existing database and app environment values intact.
2. Review the new SQL. Inspect whether `003`/`004` have already been applied. CLI-applied migrations appear in `supabase_migrations.schema_migrations`; manually pasted SQL may not have a history row. Check actual objects too. Do not re-run a migration based solely on missing CLI history.
3. These **read-only** checks establish the foundation and whether Step 02 objects exist:

```sql
select to_regclass('public.profiles') as profiles,
       to_regclass('public.user_preferences') as preferences,
       to_regclass('public.activity_sessions') as sessions,
       to_regclass('public.tonight_responses') as step02_responses,
       to_regclass('public.activity_concepts') as step02_catalog;

select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('user_preferences', 'activity_sessions')
order by table_name, ordinal_position;
```

4. When the foundation matches and Step 02 has not yet been applied, open **SQL Editor → New query**. Wrap the complete contents of `003`, followed by `004`, in one transaction: start with `BEGIN;`, paste both files in order, and end with `COMMIT;`. Review the entire query and target project, then run it yourself. A failure must roll back; do not delete existing rows or disable RLS to make it pass. If the objects already exist or the current schema differs, stop and reconcile migration state instead of resetting or replaying.
5. Verify `activity_concepts` contains the 24 `concepts-1` rows, RLS is enabled on the four new tables, and the existing user still exists. Do not put that user's ID, email or answers in shared logs/screenshots. New `answers`/completion fields do not overwrite existing private records.

## Publish a protected Preview after migration review

Use the existing Vercel project connected to **melisa0312-arch/boo-app**, selecting the **preview branch and Preview target**, not Production. Keep the current deployment protection unchanged. Because Git auto-deployment remains disabled, pushing source alone does not create a URL. Use the project's existing manual Preview deployment procedure after you authorize it; verify the selected branch/commit/environment before confirming.

In the **Preview** environment, confirm these already-existing variable names and appropriate staging/preview values through Vercel settings:

- `NEXT_PUBLIC_SUPABASE_URL` — the intended hosted testing project, never the workspace's loopback Docker URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — its matching browser-safe key, never a service-role key or database password.
- `NEXT_PUBLIC_APP_URL` — the exact protected preview origin, without a trailing slash.

Keep the existing Supabase Auth Site URL/allowed confirmation redirects consistent with the selected testing origin and `/auth/confirm`, without removing working Production redirects. Use a stable Preview origin where available; generated hosts may require an additional explicit redirect. Do not change Production environment values during the Preview check. Environment changes require a new deployment; they do not update an existing build.

If the Vercel UI action only offers Production, do not use it for this check. Confirm the project's supported Preview-from-branch/manual workflow instead. No workflow change or deployment protection change is implied by these instructions.

## Manual hosted acceptance

Use separate Chrome profiles/contexts for two controlled staging accounts. Complete private onboarding, skip an optional answer, refresh and log in again. Prepare one overnight session before joining the second account and confirm the waiting state. Join only the staging test accounts. Complete Quick/Detailed independently and verify a missing answer prevents a match. Check shared time edits invalidate both submissions, profiles remain private, reveal requires consent, feedback rerolls, and selection survives refresh. Recheck Bulgarian/English and a phone viewport. Confirm the existing hosted real user's access without writing another person's data or inviting a real second user.

## Production later, only with explicit approval

After staging and protected Preview are approved, apply the same reviewed additive SQL to the intended Production database using the backup/transaction checks, then promote the tested application version through the existing Production release process. Keep protection and Production configuration as approved. Until that approval, no merge to a Production-triggering branch, Production deployment, or real invitation is authorized.

Rollback of the app should use the previous tested deployment, leaving additive columns/tables and private user data intact. Do not drop the new schema or delete answers to roll back the frontend. Preserve result/feedback history. If migration execution failed, inspect the transaction outcome before retrying; never assume a partially applied schema is clean.
