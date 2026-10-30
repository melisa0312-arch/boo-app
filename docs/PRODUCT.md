# BŪ product

BŪ (brand `bū.`) is a private, highly personalized lifestyle application for Melisa and Stefan. Each person owns a separate account. Together they discover things to do, decide what to watch, plan dates and trips, manage wishes and surprises, and preserve shared memories. Bulgarian is the initial language; English is supported from the first slice.

## Step 01 delivered behavior

- Welcome, registration, login, session persistence, logout, and authenticated route protection.
- Personal profile name, language, and timezone. Each user can edit their own profile.
- One space per account, with at most two members. Creation and joining are transactional database operations. Private, hashed, single-use invitations expire in 48 hours. Reissuing revokes older links.
- Home introduces NOW, PLANS, OUR WORLD, and US. Only implemented destinations are interactive; later modules have explicit status labels.
- Tonight first step: now/today/future date, start/end, timezone, and manual Sofia/Chavdar origin. Saved drafts are real database rows, visible to the couple after refresh.

There are no venue recommendations yet. No expense calculations, calendar integrations, device geolocation, film results, or third-party location APIs are presented as working features.

## Step 02 delivered behavior

- Personal onboarding at `/preferences`: twelve required interest ratings, then optional focused questions about novelty, social settings, spontaneity, energy, pace, structured physical limits and category exclusions, memories, dislikes, dreams, romance, settings, surprises, automotive interests, game types, and comfort with unfamiliar activities. Every answer is independently owned. Optional questions can be skipped and edited later.
- Native keyboard-accessible rating cards, sliders, selectable options, and private text notes. Each acknowledged draft write persists answers and progress in Supabase. A refresh or later login resumes it. An editable visual summary completes the experience.
- Existing Tonight sessions continue at `/tonight/[id]`: shared time/origin first, then transport, maximum one-way travel reserve, relative budget band and indoor/outdoor setting. Edits are version-checked and visible to both people; a changed shared context cancels both submissions.
- Quick Match asks five focused questions. Detailed Match adds intention, pace, familiarity, social setting and an optional note. Suggestions initialize a new response from that user's own profile, without overwriting existing answers. Each person submits independently and may explicitly reveal submitted Tonight answers. The personal profile remains private regardless.
- Readiness and waiting states work with a one-member space. Both completed personal-interest profiles and both submitted Tonight responses are required for a joint match.
- A real deterministic engine returns one top concept and up to three alternatives from a labeled 24-concept internal catalog. Explicit category/physical exclusions, time, budget, transport, setting and current energy filter first. Ranking balances both partners. A reroll privately vetoes a specific concept; selecting a result persists it in the existing session as a draft plan.

Cost bands and concept durations are editorial planning assumptions, not venue facts. Travel time is the user-specified reserve in each direction, not a computed route. Fewer than four feasible concepts are shown honestly; no-match never silently relaxes exclusions. Free-text memories, dislikes, dreams and notes are private journals, not NLP-derived constraints: structured exclusions are the authoritative safety controls. Additional descriptive preference fields are retained for future richer ranking rather than being represented as an intelligent text model.

## Product boundaries

Couple activity records are shared. Preferences and profile records are private; a narrowly scoped function shares a partner's display name. Future surprises must have separate owner-only storage until explicitly revealed. A shared couple ID alone must never make secret or user-owned data readable by a partner.

The app is private by default: no indexable public couple pages, third-party analytics, or external font requests. A copied invitation is a bearer capability; users must share it only with the intended partner. Email confirmation verifies an account's email; invitations are deliberately not bound to a preselected email in this slice.

## First acceptance journey

Use two browser contexts. Create two independent users, pair through the generated link, complete both profiles, save an overnight Tonight draft, refresh both browsers, and log out/log in again. Verify the same draft from PostgreSQL. Verify third-user and anonymous reads/writes are denied. Hosted email delivery and production provider settings require a real project and separate validation.
