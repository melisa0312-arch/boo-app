# bū. — a private world for two

A real Bulgarian-first couples app built with Next.js App Router, strict TypeScript, Tailwind CSS, Supabase Auth, PostgreSQL, and RLS. Step 01 implements independent accounts, secure pairing, profile setup, and a persisted first step of Tonight Mode. No fake recommendations, database mocks, or localStorage persistence.

Step 02 adds private personal onboarding, resumable Quick/Detailed Tonight questionnaires, shared planning constraints, explicit answer reveals, readiness, a deterministic fair concept match engine, private feedback/reroll, and a selected draft concept on the existing session. Begin at **Profile → Preferences** or the Home personalization prompt; after saving a Tonight session, choose **Continue evening**. See [Step 02 safe release](docs/STEP02_RELEASE.md) before changing the existing hosted database or Vercel site. All new migrations are prepared for review; local setup never applies them remotely.

[Step 02 validation and desktop/mobile screenshots](docs/STEP02_VALIDATION.md) record the completed local checks and hosted verification that remains outstanding.

For a browser-accessible hosted preview without installing anything locally, follow [Vercel and Supabase deployment preparation](docs/DEPLOYMENT.md). The repository is prepared for Vercel, but automatic Git-triggered deployments are disabled and no public deployment has been performed. All environment files, including templates named `.env*`, are intentionally excluded from GitHub; configuration variable names are documented below.

## Run locally

Requires Node.js 24 and npm. Docker is needed only for local Supabase.

```sh
npm ci
npm run local:start
npm run dev
```

Open `http://localhost:3000`. `local:start` runs official Supabase Auth and PostgREST services with PostgreSQL 17 and Kong, applies repository migrations transactionally, and writes an ignored `.env.local` **only if none exists**. All published service ports bind to loopback. It generates credentials for this disposable local instance; it never connects to or changes a hosted project. Email confirmation is disabled **locally** to exercise two accounts. Existing `.env.local` is preserved; local public configuration is also in ignored `.local-supabase/app.env`. Do not copy these local credentials or this test stack into production.

For a cloud workspace's **Web Preview**, keep `npm run dev:preview` running from `/workspace/boo-app` and open the preview for **port 3000**, path `/`. That script binds to `0.0.0.0` so the preview forwarder can connect. The `localhost` address above belongs to the cloud machine; use the workspace's forwarded preview address from your own browser. Development responses permit embedding; production responses retain `X-Frame-Options: DENY`. A completed Playwright run shuts down its temporary server, so it does not leave Web Preview running.

If the development log reports a blocked hot-reload origin for the forwarded preview, set `BU_PREVIEW_ALLOWED_ORIGINS` to that exact hostname (no scheme, port, or path) and restart `npm run dev:preview`. Multiple explicit hostnames can be comma-separated; do not use a blanket wildcard. This development-only setting does not disable authentication or Server Action origin checks.

Stop with `npm run local:stop`. Start again with `npm run local:start`; the Docker volume preserves data. Do not run this smaller stack and the standard CLI stack simultaneously; they use the same ports.

The standard Supabase CLI is also supported: `npm run db:start`, then create an ignored `.env.local` using the configuration names below and its **API URL and anon/publishable key**. Migrations apply on initial startup; use `npx supabase migration up --local` for subsequent migrations. Do not reset a database containing data you need. The smaller stack exists because the managed environment's Docker VFS driver could not unpack the full Supabase PostgreSQL image. In restricted cloud networking, the supported CLI image mirror is `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`. Preserve TLS and artifact verification.

## Connect your hosted Supabase project

1. Create a Supabase project. In **Project Settings → API / API Keys**, copy the project URL and browser-safe publishable key (a legacy anon key is also supported).
2. Create an ignored `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL` (your actual local origin, initially `http://localhost:3000`). Never put a secret or service-role key in a `NEXT_PUBLIC_*` variable. On Vercel, enter these values in the project's Environment Variables settings instead of uploading any environment file.
3. Review both files in `supabase/migrations/`. Apply them in order using the SQL editor or a linked CLI migration workflow to your new project. This task does not apply remote migrations. Review migration state and back up existing data before applying to an existing project. Never use a remote database reset.
4. Under **Authentication → URL Configuration**, set the site URL and allow the exact confirmation redirect `http://localhost:3000/auth/confirm` (also add `http://127.0.0.1:3000/auth/confirm` if using it).
5. Keep email confirmation enabled for hosted use. Set the confirmation email template link to `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. The confirmation route also supports Supabase's PKCE `code` callback. Use a configured SMTP provider for reliable real mail delivery. Local tests don't validate delivery.
6. Set the Auth minimum password length to at least 10. Review Supabase rate limits. Restart Next.js after environment changes. For cloud tasks, the specific `<project-ref>.supabase.co` hostname must be allowed in the environment's network settings.

The application uses only the public project key and each signed-in user's session. It needs no service-role key. When Supabase configuration is missing, public pages still render and auth screens explain the missing setup; database features never silently fall back to local storage.

| Variable | Where to obtain it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your hosted Supabase project URL; use the local API address only for local development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | That same project's publishable key, or legacy anon key; never a secret/service-role key |
| `NEXT_PUBLIC_APP_URL` | The actual origin serving this deployment, without a trailing slash; use the exact HTTPS preview origin when hosted |

## Try the first journey

Register account A → set up its profile → create a space → generate an invitation. Open the link in a separate browser profile/private context, register account B, set up its own profile, and accept. Invitations last 48 hours, work once, and are revoked on reissue. After joining, only two accounts can belong to the space. From Home, choose the prominent adventure action, enter a date/time window and Sofia or Chavdar, then save. Refresh to read it from PostgreSQL; the other account can see it too. Each account edits only its own profile.

An end time before the start means the next local calendar day. Equal times are invalid. IANA timezones, UTC instants, daylight-saving ambiguity rejection, and a 366-day planning horizon are supported. The database recomputes the instants rather than trusting the browser.

## Checks

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run local:db-test
BU_ALLOW_TEST_SIGNUPS=1 npm run test:integration
npx playwright install chromium
BU_ALLOW_TEST_SIGNUPS=1 npm run test:e2e
```

Integration and complete journey tests require the running disposable loopback stack and explicitly opt in to creating random test accounts. They refuse hosted destinations. `npm test` runs units and reports integration cases as skipped unless `BU_INTEGRATION=1`. SQL tests run inside a transaction and roll back. API/browser tests leave test accounts and sessions in the disposable local volume. Do not use real personal data in test fixtures.

Playwright runs both desktop and mobile Chromium viewports. In environments with a system browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` instead of downloading a browser. Successful authenticated Home screenshots are written to ignored `test-results/`. `npm run build && npm start` serves the production build.

To run the same browser suite against the production server, build first, then use `BU_E2E_PRODUCTION=1 BU_ALLOW_TEST_SIGNUPS=1 npm run test:e2e`. The browser suite includes automated WCAG A/AA audits on welcome, login, Home, and Tonight. Automated audits complement keyboard and visual checks; they are not a complete accessibility certification.

Types are generated from the actual schema: `npm run local:types` for the small stack, `npm run db:types` for the standard CLI stack. Commit regenerated types with schema changes. Keep `.env.local`, `.local-supabase/`, screenshots, auth traces, and generated credentials out of Git.

## Continue building

Read [PRODUCT](docs/PRODUCT.md), [ARCHITECTURE](docs/ARCHITECTURE.md), [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md), [DATABASE](docs/DATABASE.md), [ROADMAP](docs/ROADMAP.md), and [DECISIONS](docs/DECISIONS.md) before changing behavior. The next slice is Tonight mood, interests, and shared constraints, persisted under the same couple isolation. All planned v1 modules remain in the roadmap. Use the current isolated checkout; a separate worktree is unnecessary unless explicitly requested.

See [VALIDATION](docs/VALIDATION.md) for executed checks and the remaining hosted-integration limits.
