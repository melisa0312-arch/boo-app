# Decision log

## 2026-10-30 — Step 01 foundation

1. **Real full stack from the first slice.** Next.js App Router and Server Actions sit over Supabase Auth/PostgreSQL. Public project keys plus user sessions are sufficient. No service-role key, fake calls, or localStorage database fallback.
2. **Independent identities; one couple, two members maximum.** Unique membership, RPC transactions, per-user locks, couple row locks, and an independent database capacity trigger enforce this. Couple departure, account deletion, and repairing membership need a separate product/security slice; they are not casually exposed as CRUD.
3. **Invitations are private bearer capabilities.** 256-bit random token, hash at rest, 48-hour expiry, one use, revoke on reissue. Email binding is not required in this slice. Treat link holders as authorized to use the open slot; don't share links publicly.
4. **Privacy is table- and record-specific.** Shared activity sessions do not imply partner access to preferences or future surprises. Profile rows are self-only; a narrowly scoped RPC shares display names. Future profile expansion must not broaden this RPC by accident.
5. **Wall clocks and instants are both first-class.** Store the intended local date/clocks and timezone along with derived UTC instants. Earlier end clock means next day; equal clocks are invalid. Reject DST ambiguity instead of guessing. Default to Europe/Sofia while supporting validated other zones.
6. **Bulgarian starts the experience.** Both dictionaries are typed and complete. A persistent HttpOnly locale cookie changes the entire document language, native localization, and UI; profile saves the preference too. Display: Unbounded; body: Sofia Sans. Local font packages avoid network-dependent builds and retain Cyrillic support.
7. **Original editorial UI with honest scope.** Four navigation worlds, warm canvas, saturated hero and pastel cards. Future modules are status text. Only real implemented actions are buttons/links. No fake venue cards or imaginary generated results.
8. **Realtime waits for a real collaborative behavior.** Refresh currently reads real shared rows. Enable selected publications and subscriptions only when a vertical slice needs them and has access tests.
9. **Test against real local services.** Unit tests cover domain rules. SQL tests cover RLS and database invariants. API/browser tests opt into a disposable loopback project and create random test accounts. The minimal Docker harness works around full-image VFS storage exhaustion without changing Docker drivers or bypassing network policy. It is not a hosted-production equivalence claim.
10. **Keep setup and publication separate.** No remote database changes or public deployment occurred. Never publish, reset, or destructively modify a remote database without user authorization. Reuse the current isolated checkout instead of making unsolicited worktrees.

## Continuing work without losing decisions

Read the six domain/design/architecture docs plus README. Start with Git status and preserve existing changes. Choose the next roadmap slice, add a dated decision if behavior changes, and keep old decisions with an explicit superseding note. Write forward migrations; regenerate database types; test anonymous, self, partner, and unrelated-couple behavior. Keep both languages and narrow/mobile layouts working. Update documentation and report actual check results, including skipped/unverified behavior. Never treat a passing mock or a rendered screen as proof of real backend connectivity.

## 2026-10-30 — GitHub and Vercel preparation

Use the existing `melisa0312-arch/boo-app` repository. Upload application source, migrations, tests, and documentation; exclude every `.env*` file, including the local example template. Document configuration names in README and DEPLOYMENT instead. Exclude generated local credentials, Docker state, build artifacts, and browser results. Vercel's automatic Git deployment switch stays off until the user explicitly authorizes a deployment workflow. A successful Git push is not a deployed preview. The hosted application requires hosted Supabase; the workspace's loopback Docker addresses cannot serve a Vercel deployment.

## 2026-10-30 — Step 02 personalization and matching

- Keep the real hosted account/database untouched. Work on the existing `preview` branch, test on the loopback Docker stack, prepare forward SQL for manual review, and retain existing deployment protection and the Git deployment switch.
- Extend `user_preferences` and `activity_sessions`; do not replace the session model or copy private answers into shared profile rows. Narratives/descriptive tastes remain private structured data for future features, without pretending to run NLP.
- Run the authoritative joint engine inside restricted PostgreSQL functions. A caller receives sanitized results/progress, not both partners' raw profiles. Keep a pure TypeScript reference kernel and test SQL parity. This avoids introducing a server-role key just to compute a match.
- Quick has five focused questions; Detailed adds five. Twelve personal interests are required, other onboarding questions may be skipped. Never assume a second member exists. Completion and submission are real persisted states, not default answers for another person.
- Use serialized acknowledged autosave and compare-and-swap versions. A context change cancels both submissions; profile/response edits invalidate affected readiness/results/selection. Poll only sanitized authorized state every seven seconds, pausing in hidden tabs. No private Realtime channel is introduced.
- Consent reveals only submitted Tonight responses, including retained Detailed answers shown in the review. It does not grant row access or reveal the personal profile; revocation affects future reads and cannot erase a partner's memory.
- Use the generic internal catalog, qualitative budget levels and explicit travel reserves. Never claim routes, prices, availability or real venues. Preserve hard limits even if fewer than four concepts remain. Rank by a fair lower-score-first heuristic; display no compatibility percentages. Reroll feedback vetoes a concept for that context; keep the reason owner-private.
