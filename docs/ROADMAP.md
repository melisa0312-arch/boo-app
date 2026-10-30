# BŪ v1 roadmap

Retain this feature inventory while implementing tested vertical slices. A section being visible on Home is not an implementation claim.

## Foundation — Step 01

Implemented: Next.js/TypeScript/Tailwind architecture, Bulgarian/English, brand system, independent Supabase accounts, pairing with expiring single-use invitations and a two-person limit, own profile setup/editing, Home, and persisted Tonight date/time/origin. RLS, SQL migrations, domain/API/browser tests, and local development tooling are included. Hosted project setup, email delivery, and production validation remain environment-specific.

## NOW

Step 02 now implements private personal onboarding, independent Quick/Detailed Tonight answers, shared planning context, readiness/optional reveals, and deterministic concept matching with feedback and selection. Real catalogs/venues, route/price/opening checks, movie/home/trip adapters and personalized dress recommendations remain future slices.

- Go Out / Tonight Mode: date/time/origin → shared mood and interests → budget, distance, constraints → real place/activity candidates → matching and selection.
- Stay In: personalized home activities and shared experiences.
- BŪ Watch: movie discovery, film matching, partner taste and availability, shared watchlist and viewing history.
- Quick Match: low-friction matching and decisions for two.
- Surprise Us: personalized discovery without fabricated recommendations.
- Matching engine: explicit and learned preferences, fair partner balancing, explainable ranking, feedback, and practical constraints.
- Dress recommendations: weather/context/occasion-aware recommendations, grounded in individual wardrobes and comfort preferences.
- Personalized activities: interests, energy, availability, context, and feedback.

## PLANS

- Dates and shared plans, invitation sending/acceptance, scheduling and reminders.
- Travel and trip planning: destination discovery, itineraries, budgets, bookings/links, and packing context.
- Calendar: couple events, activity sessions, availability, timezone handling, and later reviewed external integrations.
- Secret surprises: private creation and planning, controlled reveal, separate access tests, and privacy-safe notifications.

## OUR WORLD

- Wishlist: personal and shared wishes, places, activities, gifts, watchlists, and trip ideas.
- Memories: notes, photos/media, dates, stories, and associations to activities/trips.
- Expenses: shared spending, categories, splitting/balances, trip/date budgets, and per-record privacy decisions.
- Quests: shared challenges, progress, and motivation.
- Achievements: meaningful milestones and celebrations.
- Shared maps: visited places, memories, saved places, travel, and future plans.

## US

- Personal profiles: identities, context, onboarding, and personal customization.
- Interests and preferences: shared overlaps, differences, explicit privacy, matching inputs.
- Settings: languages, timezones, notifications, accessibility, security, privacy, account lifecycle, and couple lifecycle.
- Wardrobes: private wardrobe items, outfits, occasion tags, comfort, seasons, and later dressing suggestions.

## Recommended slice order

1. Completed in Step 02: Tonight mood/interests/constraints with private profile preference editing, independent answers, fair concept matching and persisted drafts. Continue refining the existing session model.
2. Real curated activity/place catalog with provenance, availability, and matching explanations. External location services require a separate integration decision; manual origins remain valid.
3. Turn a selected activity into a date invitation, with partner response and optional authorized Realtime updates.
4. Wishlist + memories around completed dates; then BŪ Watch and the first film matching slice.
5. Travel/calendar, private surprises, shared maps, expenses, quests/achievements, and wardrobes/dressing as independently tested slices.

Before each slice: review product/decisions, name success/empty/error states, define privacy boundaries, add migrations and generated types, implement server authorization and UI together, and test both partners plus outsiders. Keep all listed v1 features even when priorities change. Do not silently remove or label planned features as complete.
