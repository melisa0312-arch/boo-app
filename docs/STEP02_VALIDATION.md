# Step 02 validation — 2026-10-30

Validated locally on the existing application and disposable Supabase Auth/PostgREST/PostgreSQL stack. No hosted account, hosted database, real invitation, deployment protection, or Production deployment was changed. The existing `preview` branch is the release-review target; the Git deployment switch stays disabled.

| Check | Final result |
| --- | --- |
| ESLint | Passed, no warnings |
| Strict TypeScript | Passed |
| Next.js production build | Passed, including `/preferences` and `/tonight/[id]` |
| Unit tests | 31 passed, including the original 17 |
| Real local Supabase API tests | 15 passed, including the original 5 |
| Transactional database security assertions | 38 passed, including the original 24; all fixtures rolled back |
| Production Chromium browser tests | 8 passed: all Step 01 and Step 02 journeys on desktop and mobile |
| Automated WCAG A/AA audits | No violations on tested welcome/login/Home, initial Tonight, focused onboarding, summary and results views |
| Original migrations | `001` and `002` unchanged |
| Deployment configuration | `vercel.json` unchanged; automatic Git deployments still disabled |

## Behaviors exercised

The new browser journey uses two disposable local accounts and separate browser contexts. It completes one partner's onboarding interactively, skips optional questions, checks autosave and refresh resume, creates an overnight session, confirms shared context, answers Quick Match while alone, and verifies a waiting state without an invented partner. After the second local account joins and completes its profile, it answers Detailed Match, including a synthetic private note. The first person can calculate a shared match but cannot see that note. The journey saves a selected concept, rerolls with feedback, edits shared finish time from the partner context, confirms both submissions are invalidated, switches to English, and verifies personal preferences after logout/login. The original signup/invitation/profile/session journeys still pass unchanged.

API checks separately cover private completion/drafts, stale versions, malformed inputs, independent drafts, required two-person submission, direct row-access denial, private notes/memories absent from shared payloads, explicit reveal and revocation, persisted selections, stale-selection denial, private feedback, no-match without relaxing exclusions, and invalidation after a personal-profile change. SQL/TypeScript ranking parity is checked for both uniform and contrasting preference/style inputs; the database catalog is compared with the versioned TypeScript catalog. Unit tests cover fairness, deterministic ordering, partner-order invariance, time/travel reserve, budget, transport, setting, energy overrides, permanent/temporary exclusions and feedback vetoes.

The new SQL suite simulates an unrelated authenticated identity at the RLS boundary rather than registering a real third person. It verifies denied progress/results/context/response/selection operations and blocks forged completion, direct response writes, direct feedback and fabricated match rows. No third person is invited.

## Screenshots

All screenshots show **synthetic local accounts and generic test answers**, not personal user data. They were captured in Chromium against the production build. The mobile project is a mobile Chromium viewport, not physical iOS/Safari.

| View | Desktop | Mobile |
| --- | --- | --- |
| Focused onboarding | [Desktop](screenshots/step02-onboarding-desktop.png) | [Mobile](screenshots/step02-onboarding-mobile.png) |
| Personal summary | [Desktop](screenshots/step02-summary-desktop.png) | [Mobile](screenshots/step02-summary-mobile.png) |
| Shared match results | [Desktop](screenshots/step02-results-desktop.png) | [Mobile](screenshots/step02-results-mobile.png) |

## Remaining verification and limits

- The new migrations have not been applied to hosted Supabase, and no Vercel release was performed. Hosted email delivery, real project settings and end-to-end behavior at the actual protected Preview origin remain to be checked using [STEP02_RELEASE](STEP02_RELEASE.md).
- There are no verified real venues, prices, routes, opening hours, movie streams or external recommendations. Catalog durations and qualitative budget bands are planning assumptions. The travel cap is reserved conservatively in both directions, not a route calculation.
- Free-text notes and descriptive tastes are stored privately but are not interpreted as hard safety rules. Structured categories/tags are enforced. A real setting still needs accessibility, dietary, safety and availability review by the people planning it.
- Answer reveals are opt-in and revocable for future reads. Previously observed information cannot be recalled from a partner. Personal profile rows remain private even when a Tonight answer is shared.
- Autosave guarantees acknowledged database writes, not an edit closed before its in-flight request completes. The saved/saving/error status is explicit; Back/Next/Skip flush writes and failures expose retry. No localStorage fallback exists.
- Browser behavior beyond Chromium, physical devices, exhaustive screen-reader testing, deployment restoration into a new task, and hosted Supabase migration execution are unverified. Automated accessibility audits are not a full accessibility certification.

The authoritative engine is SQL with a TypeScript reference; changes must preserve parity tests and bump the engine/catalog version when semantics change. Match explanations describe shared constraints and balancing policy; they do not report scientific compatibility percentages or private per-person scores.
