# BŪ product

BŪ (brand `bū.`) is a private, highly personalized lifestyle application for Melisa and Stefan. Each person owns a separate account. Together they discover things to do, decide what to watch, plan dates and trips, manage wishes and surprises, and preserve shared memories. Bulgarian is the initial language; English is supported from the first slice.

## Step 01 delivered behavior

- Welcome, registration, login, session persistence, logout, and authenticated route protection.
- Personal profile name, language, and timezone. Each user can edit their own profile.
- One space per account, with at most two members. Creation and joining are transactional database operations. Private, hashed, single-use invitations expire in 48 hours. Reissuing revokes older links.
- Home introduces NOW, PLANS, OUR WORLD, and US. Only implemented destinations are interactive; later modules have explicit status labels.
- Tonight first step: now/today/future date, start/end, timezone, and manual Sofia/Chavdar origin. Saved drafts are real database rows, visible to the couple after refresh.

There are no venue recommendations yet. No mock matches, expense calculations, calendar integrations, device geolocation, film results, or third-party location APIs are presented as working features.

## Product boundaries

Couple activity records are shared. Preferences and profile records are private; a narrowly scoped function shares a partner's display name. Future surprises must have separate owner-only storage until explicitly revealed. A shared couple ID alone must never make secret or user-owned data readable by a partner.

The app is private by default: no indexable public couple pages, third-party analytics, or external font requests. A copied invitation is a bearer capability; users must share it only with the intended partner. Email confirmation verifies an account's email; invitations are deliberately not bound to a preselected email in this slice.

## First acceptance journey

Use two browser contexts. Create two independent users, pair through the generated link, complete both profiles, save an overnight Tonight draft, refresh both browsers, and log out/log in again. Verify the same draft from PostgreSQL. Verify third-user and anonymous reads/writes are denied. Hosted email delivery and production provider settings require a real project and separate validation.
