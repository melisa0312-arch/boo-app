# Database and security

Migrations live in `supabase/migrations`. Apply in lexical order. The second migration makes calculated UTC fields optional to generated insert types; a BEFORE trigger always recomputes them. Types in `src/lib/supabase/database.types.ts` are generated from the migrated local database. Regenerate rather than hand-maintaining a parallel schema model.

| Table | Ownership and access |
| --- | --- |
| `profiles` | Auth user primary key. Self read/update of name, locale, timezone. No direct insert/delete; Auth trigger bootstraps it. |
| `couples` | Shared identity. Member read. Created only through `create_couple`. |
| `couple_members` | Unique user membership, composite couple/user key. Same-couple read; no direct client writes. |
| `couple_invitations` | SHA-256 token hash, creator, expiry, consumed timestamp. Members can read non-secret metadata columns only. No token/hash retrieval or direct writes. |
| `user_preferences` | Owner-only interests record, prepared for later preference UI. Partner cannot read it. |
| `activity_sessions` | Couple-shared drafts. Member read; member insert only as self. Client updates/deletes are intentionally not granted in Step 01. |

## Transactional RPCs

`create_couple(couple_name)` locks per user, creates the space and membership atomically, and rejects a second space. `issue_couple_invitation()` requires membership and an available second slot, locks the space, consumes older tokens, and generates 32 cryptographically random bytes encoded as 64 hex characters. It returns the bearer token once and stores only its digest. `join_couple(invitation_token)` authenticates, locks the user and couple in consistent order, checks expiry/consumption/capacity, inserts membership, and consumes the invitation in the same transaction. Two competing joins cannot both succeed. A membership trigger independently enforces a two-person maximum.

These are narrowly scoped `SECURITY DEFINER` functions with empty search paths and explicit auth checks. Execution is revoked from PUBLIC/anon and granted only to authenticated users. Private helpers are outside the exposed API schemas, with only the membership predicate callable by the policy role. RLS is enabled on all six tables; blanket default grants are removed. No application service-role key bypasses RLS. The partner display-name RPC intentionally returns only the name for the caller's couple; it does not expose the private profile row.

## Activity time model

Store `couple_id`, `created_by`, `activity_mode`, `activity_date`, local `start_time` and `end_time`, IANA `timezone`, `ends_next_day`, calculated `starts_at`/`ends_at` UTC instants, `starting_location`, `timing`, `status`, and created/updated timestamps. `Europe/Sofia` is the initial zone. Other zones are validated by both the application and PostgreSQL's timezone catalog.

An earlier end clock means the next local date; equal clocks are invalid. This handles midnight, month, and year boundaries. Temporal rejects nonexistent/repeated times; the database checks round trips and repeated offsets independently (including normal whole-hour and half-hour DST transitions). Dates must be no more than 366 days ahead, with five minutes of submission tolerance for the start. The app's "now" and "today" modes resolve against the server's current instant in the selected zone. Database constraints ensure positive, bounded duration; the trigger ignores client-provided UTC instants and rollover flags. Stored instants remain historically stable after later timezone rule updates. Extremely unusual historical non-quarter-hour transitions are outside the future planning window; application Temporal validation remains authoritative for ambiguity.

## Security validation

`supabase/tests/security.sql` provides 24 TAP-compatible assertions inside a rolled-back transaction: self/partner boundaries, anonymous denial, direct membership denial, old/expired/consumed links, maximum capacity, session sharing, foreign-couple denial, spoofed creators, and equal-time rejection. The CLI's `supabase test db` can execute it on a standard local instance. The smaller stack uses `npm run local:db-test`.

API integration tests exercise real GoTrue signups, private bootstrap rows, RPCs, a concurrent invitation race, and PostgREST RLS. Browser tests add cookies, route protection, two independent accounts, form validation, refresh persistence, and logout/login. None of these tests use a hosted admin key. Review policies and write negative tests whenever adding tables. Future private surprises and expense details require explicit privacy decisions before policy implementation.

## Step 02 forward migrations

Apply **003 then 004** after the existing foundation migrations. Neither foundation migration is rewritten. No existing user, membership, invitation, preference, or session is reset or deleted. Existing `user_preferences.interests` is preserved. New JSON answers start empty; completion stays null for existing users until they actually finish. Existing sessions receive planning defaults and an unconfirmed shared context, without creating a competing session model.

| Storage | Step 02 additions / access |
| --- | --- |
| `user_preferences` | Private `answers`, `onboarding_step`, `completed_at`, monotonic `version`. Self-only read; checked `save_personal_preferences` mutation. Existing own-interest grants remain unchanged. |
| `activity_sessions` | `transport`, `max_travel_minutes`, `budget_level`, `environment`, `context_revision`, `context_completed`, `selected_concept_id`. Shared member read; edits through `update_tonight_context`. |
| `tonight_responses` | One private row per session/user: typed partial answers, step, mode, reveal choice, context revision, version and submission timestamp. Only own reads, no direct client writes. |
| `activity_concepts` | Generic bilingual internal catalog with category/tag, duration/budget-band/style metadata. Authenticated read, no client writes. |
| `match_results` | Append-only result iterations, current/stale flag, version fingerprint, engine/catalog version, and sanitized concept/reason list. Couple read, no client writes or private input/score columns. |
| `match_feedback` | Per-user concept veto, reason, context revision, timestamp. Own read only; checked RPC writes. |

JSON contracts are validated independently in Zod and PostgreSQL: exact keys and enumerations, 1–5 integer ratings, bounded non-duplicated arrays, limited text, payload size, and completion requirements. Versions reject stale tabs and stale shared contexts. RLS covers every new table. Public RPC execution is revoked from anon/PUBLIC and granted only to authenticated users; every definer RPC checks membership/identity itself with an empty search path. No service-role key is added.

`tonight_progress` exposes display name/readiness/progress/profile-completion status and, **only after submission plus explicit consent**, that person's Tonight answer object. It never reveals their personal preferences. Editing/revocation withdraws future reveals; a partner cannot be made to forget information already seen, so consent copy should not promise recall. Raw response-table reads remain private even after reveal.

`calculate_couple_match` requires exactly two current members with completed interests and submitted answers for the current context. It uses the couple lock for a consistent snapshot, reuses an unchanged result fingerprint, filters hard constraints and ranks feasible concepts. The fingerprint is based on IDs and versions, not hashes of private free text. No inputs or individual scores are returned. `record_match_feedback` accepts a concept only from a current result and invalidates that result; the next calculation excludes the vetoed concept. Reasons are stored privately, without silently rewriting the user's other constraints. `select_match_concept` accepts only a non-stale matching result/concept pair and stores the selection on the existing session.

## Matching formula and limits

Available activity minutes = stored UTC end minus start, minus **twice** the chosen one-way travel reserve. This remains correct across midnight/DST. Candidate duration, ordinal budget, environment, required transport, current energy, both permanent/temporary category exclusions and physical tags are hard filters. Unknown routes or opening times are not fabricated.

Each private person score combines mean relevant interest ratings, desired categories, mood, energy/style fit, familiarity and sociability. Joint ranking is `0.75 × min(A,B) + 0.25 × mean(A,B) − 0.05 × abs(A−B)`, with concept ID as the deterministic tie-breaker. These are engineering heuristics, not compatibility probabilities. Personal energy is only a default; an explicit Tonight energy choice takes precedence. Permanent physical/category exclusions continue to apply until the owner edits their profile.

Free-text notes and narrative/descriptive fields are not parsed into safety constraints. Explicit structured tags/exclusions are enforced; real settings, dietary/accessibility details, costs and availability still need checking before a real plan. No claim is made that a concept is safe for every possible medical limitation.
