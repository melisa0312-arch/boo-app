# Architecture

## Runtime and boundaries

Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4, Lucide, Supabase SSR/Auth/PostgreSQL. The exact compatible stable versions are locked in `package-lock.json`; use `npm ci`, not an unreviewed upgrade. Node 24 is pinned in `.nvmrc` and `engines`.

Server Components query Supabase with the current user's public key/session. Server Actions validate Zod input, authorize, write through the same user-scoped client, and revalidate affected routes. Presentation components never invent database responses. Domain time conversion uses Temporal independently of UI and Next.js.

`src/proxy.ts` implements Next.js's current Proxy convention, refreshes Supabase cookies with `getClaims()`, and forwards SDK cookie/cache headers. Route data and every mutation independently use `getUser()` plus RLS. Client-supplied couple IDs, owners, auth metadata, or cached session claims never grant membership. Authenticated responses use private/no-store caching; no shared data cache wraps user queries. React `cache()` deduplicates only within the request.

## Structure

| Path | Responsibility |
| --- | --- |
| `src/app` | Routes, layouts, loading/error/recovery boundaries |
| `src/app/(protected)` | Authenticated Home, couple, profile, Tonight |
| `src/actions` | Auth, account, and session mutations |
| `src/components` | Reusable presentation, accessible forms, visual system |
| `src/lib/auth.ts` | Session, profile, and couple authorization gates |
| `src/lib/time.ts` | Timezone-aware overnight domain rules |
| `src/lib/validation.ts` | Shared input contracts; authoritative validation is server-side |
| `src/lib/i18n` | Typed complete Bulgarian/English dictionaries, server cookie selection |
| `src/lib/supabase` | Browser/server factories and generated schema models |
| `supabase/migrations` | Reviewable ordered database changes |
| `supabase/tests` | Transactional database permission tests |
| `tests` | Unit, real API integration, and browser journey tests |

## Routes and flow

`/` → `/signup` or `/login` → `/profile` → `/couple` → `/home` → `/tonight`.

`/join?token=…` validates token shape and stores a short-lived HttpOnly invitation cookie before redirecting to the authenticated couple flow. This removes the token from subsequent page URLs. The cookie survives login/registration in that browser and is removed after a successful join. `/auth/confirm` accepts email token hashes or PKCE codes and redirects only to a fixed internal route. A confirmation opened on another device needs the original invitation link again. Referrers are disabled, and no invitation or credential is intentionally logged by app code; production infrastructure must redact invitation query strings too.

Unconfigured Supabase is an explicit setup state. Auth forms are unavailable, protected routes redirect to login, and no substitute data store runs. Database/query failures reach a friendly retry boundary, without exposing SQL or raw auth errors to the user.

## Future modules

Extend as vertical feature slices: `features/now`, `features/plans`, `features/our-world`, `features/us` when their first behavior lands. Keep domain logic, typed repositories, and UI small. Add tables and policies with the slice; do not add placeholder CRUD for the whole roadmap. Realtime is deliberately off until a collaborative behavior needs subscriptions; enable publication selectively and test authorization before adding it. No service-role client is present in the app.

## Local infrastructure

The normal Supabase CLI configuration is in `supabase/config.toml`. `scripts/local-stack.mjs` is an alternative minimal local integration harness using the official Auth and PostgREST services, PostgreSQL 17, and Kong. It provisions random local-only credentials, loopback bindings, a persistent test volume, and transactional migration history. It preserves existing `.env.local`. It is not a production Supabase deployment and does not exercise every hosted extension, asymmetric signing key configuration, SMTP, or Supabase platform behavior.
