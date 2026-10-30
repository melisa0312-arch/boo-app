# Step 01 validation — 2026-10-30

Executed in the managed Linux workspace using Node 24.19.0 and the committed dependency lockfile. The app was tested against a disposable local stack of official Supabase GoTrue 2.197.0, PostgREST 16.5, PostgreSQL 17.11, and Kong 2.8.1. This is real auth and PostgreSQL persistence, not mocked requests.

| Check | Result |
| --- | --- |
| ESLint | Passed, no warnings |
| Strict TypeScript | Passed |
| Next.js production build | Passed; all application routes compiled |
| Vitest domain/input/i18n tests | 17 passed |
| Real Supabase API integration | 5 passed, explicitly enabled against loopback |
| Transactional SQL/RLS assertions | 24 passed, rolled back |
| Production Playwright | 6 passed: 3 journeys × desktop/mobile Chromium |
| Automated WCAG A/AA page audits | No violations on welcome, login, Home, Tonight in both viewports |
| Font binary inspection | Both WOFF2 families contain the Bulgarian alphabet including `ѝ`; Unbounded includes BGR localized substitutions |
| Production dependency audit | No vulnerabilities reported |
| Repository hygiene | Environment files, credentials, dependencies, browser results, and builds ignored |

The browser suite starts `next start` with the real production build. It verifies registration of two independent accounts, profile setup, creating a couple, generating a private invitation, joining from a separate browser context, Home, invalid equal-time rejection, an overnight Chavdar draft, refresh in both accounts, logout, rejection of protected access after logout, friendly wrong-password feedback, login again, and an own-profile edit surviving refresh and appearing as the partner name. It also checks language persistence, a malformed invitation, a missing page's recovery link, and narrow-screen horizontal overflow. Visual inspection of authenticated Home screenshots informed the final SVG icon fixes.

Direct API tests exercise a concurrent invitation race: exactly one of two competing join requests succeeds. SQL tests independently verify revoked/expired/used invitations, two-member capacity, owner-only profile/preferences access, shared partner sessions, denied outsiders/anonymous users, and spoofed creator denial. Unit tests cover UTC conversion, midnight/year changes, planning bounds, now semantics, other timezones, and DST gaps/overlaps.

## Not verified

- A hosted Supabase project's settings, migration application, production email delivery, confirmation emails, and provider-specific signing-key configuration. No hosted credentials were supplied, and no remote migration or public deployment was performed.
- The complete standard Supabase CLI image stack in this managed environment: the full database image exceeded Docker VFS unpacking capacity. The tested smaller stack avoids that limit; standard CLI configuration remains available for suitable developer machines.
- Safari/WebKit, Firefox, physical devices, exhaustive screen-reader testing, and manual accessibility certification. Mobile tests use a Chromium mobile viewport, not an actual iPhone.
- Future modules and features in ROADMAP. Realtime is not needed by this slice and remains off.

To reproduce the local checks, follow README. Test accounts are synthetic and stay only in the disposable local volume; transactional SQL fixture rows are rolled back. Never point opt-in test-account creation at a real hosted project. This report documents the current workspace, not restoration into another task or publication of the environment.

## GitHub/Vercel preparation checks — 2026-10-30

A clean export of the upload source, containing no environment files or local database state, passed `npm ci`, ESLint, strict TypeScript checking, all 17 unit tests, and a production build. Gitleaks 8.30.1 (download verified against the official release checksum) reported no secrets in the source upload. The upload manifest excludes every `.env*` file, dependencies, builds, generated credentials, logs, and browser artifacts. `vercel.json` selects Next.js with `npm ci` / `npm run build` and disables Git-triggered deployments. These checks do not create a Vercel deployment or validate hosted Supabase/email configuration; follow DEPLOYMENT for that separate step.
