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
