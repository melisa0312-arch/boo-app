import { beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { Temporal } from "@js-temporal/polyfill";
import type { Database } from "@/lib/supabase/database.types";
import { interests, personalSchema, type TonightAnswers } from "@/features/personalization/model";
import { catalog } from "@/features/match/catalog";
import { rankConcepts } from "@/features/match/engine";
if (existsSync(".env.local")) loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "", key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
describe.skipIf(process.env.BU_INTEGRATION !== "1")("Step 02 real local Supabase", () => {
  const clients: SupabaseClient<Database>[] = [], ids: string[] = [], credentials: { email: string; password: string }[] = [];
  const preferences = personalSchema.parse({ ratings: Object.fromEntries(interests.map(k => [k, 3])), limitation_tags: ["walking"], favorite_experiences: "LOCAL_ONLY_PRIVATE_MEMORY" });
  const answers = { mood: "curious" as const, energy: 3, desired_interests: ["creative" as const], notes: "LOCAL_ONLY_PRIVATE_NOTE" };
  let session: string, revision = 1, resultId = "";
  let context: { activity_date: string; start_time: string; end_time: string; timezone: string; starting_location: string; timing: string; transport: string; max_travel_minutes: number; budget_level: number; environment: string };
  beforeAll(async () => {
    if (process.env.BU_ALLOW_TEST_SIGNUPS !== "1" || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) throw new Error("Disposable local Supabase and explicit signup opt-in required");
    for (let n = 0; n < 2; n++) {
      const c = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const auth = { email: `step02-${randomUUID()}@example.test`, password: randomBytes(20).toString("hex") };
      const signed = await c.auth.signUp(auth); expect(signed.error).toBeNull(); ids.push(signed.data.user!.id); clients.push(c); credentials.push(auth);
      expect((await c.from("profiles").update({ display_name: `Local partner ${n + 1}` }).eq("id", ids[n])).error).toBeNull();
    }
    const couple = await clients[0].rpc("create_couple", { couple_name: "Step 02 disposable test" }); expect(couple.error).toBeNull();
    const date = Temporal.Now.zonedDateTimeISO("Europe/Sofia").toPlainDate().add({ days: 1 }).toString();
    const saved = await clients[0].from("activity_sessions").insert({ couple_id: couple.data!, created_by: ids[0], activity_date: date, start_time: "21:00", end_time: "01:30", timezone: "Europe/Sofia", starting_location: "sofia", timing: "future" }).select().single();
    expect(saved.error).toBeNull(); session = saved.data!.id;
    context = { activity_date: date, start_time: "21:00", end_time: "01:30", timezone: "Europe/Sofia", starting_location: "sofia", timing: "future", transport: "walk", max_travel_minutes: 15, budget_level: 1, environment: "either" };
    const updated = await clients[0].rpc("update_tonight_context", { p_session: session, p_context: context, p_expected_revision: 1 }); expect(updated.error).toBeNull(); revision = updated.data!;
  });
  async function submit(n: number, data: TonightAnswers = answers, share = false) {
    const row = await clients[n].from("tonight_responses").select("version").eq("session_id", session).maybeSingle();
    const saved = await clients[n].rpc("save_tonight_response", { p_session: session, p_answers: data, p_step: 5, p_mode: "quick", p_share: share, p_expected_version: row.data?.version ?? 0, p_context_revision: revision, p_submit: true });
    expect(saved.error).toBeNull(); return saved.data!;
  }
  it("saves and resumes private onboarding before the partner joins", async () => {
    const saved = await clients[0].rpc("save_personal_preferences", { p_answers: { ratings: { cars: 4 } }, p_step: 1, p_expected_version: 0 }); expect(saved.error).toBeNull();
    await clients[0].auth.signOut(); expect((await clients[0].auth.signInWithPassword(credentials[0])).error).toBeNull();
    const resumed = await clients[0].from("user_preferences").select("*").single(); expect(resumed.data?.onboarding_step).toBe(1); expect(resumed.data?.answers).toEqual({ ratings: { cars: 4 } });
    expect((await clients[0].rpc("calculate_couple_match", { p_session: session })).data).toEqual({ state: "waiting" });
    expect((await clients[0].from("match_results").select("*")).data).toEqual([]);
  });
  it("rejects stale tabs, invalid inputs, and unauthorized preference writes", async () => {
    expect((await clients[0].rpc("save_personal_preferences", { p_answers: preferences, p_step: 29, p_expected_version: 0, p_complete: true })).error?.message).toBe("edit_conflict");
    expect((await clients[0].rpc("save_personal_preferences", { p_answers: { ratings: { cars: 6 } }, p_step: 0, p_expected_version: 1 })).error).not.toBeNull();
    expect((await clients[1].from("user_preferences").select("*").eq("user_id", ids[0])).data).toEqual([]);
    expect((await clients[1].from("user_preferences").update({ answers: preferences }).eq("user_id", ids[0])).error?.code).toBe("42501");
    expect((await clients[0].rpc("save_personal_preferences", { p_answers: preferences, p_step: 29, p_expected_version: 1, p_complete: true })).error).toBeNull();
    expect((await clients[1].rpc("save_personal_preferences", { p_answers: preferences, p_step: 29, p_expected_version: 0, p_complete: true })).error).toBeNull();
    const invite = await clients[0].rpc("issue_couple_invitation"); expect((await clients[1].rpc("join_couple", { invitation_token: invite.data! })).error).toBeNull();
  });
  it("does not finalize with one person's submission or the partner's draft", async () => {
    await submit(0);
    const saved = await clients[1].rpc("save_tonight_response", { p_session: session, p_answers: answers, p_step: 2, p_mode: "quick", p_share: false, p_expected_version: 0, p_context_revision: revision }); expect(saved.error).toBeNull();
    expect((await clients[0].rpc("calculate_couple_match", { p_session: session })).data).toEqual({ state: "waiting" });
    expect((await clients[0].from("tonight_responses").select("*")).data).toHaveLength(1);
    expect((await clients[1].from("tonight_responses").select("*")).data).toHaveLength(1);
  });
  it("matches the TypeScript reference kernel and reuses identical results", async () => {
    await submit(1);
    const calculated = await clients[0].rpc("calculate_couple_match", { p_session: session }); expect(calculated.error).toBeNull();
    const result = await clients[0].from("match_results").select("*").eq("session_id", session).eq("stale", false).single(); expect(result.error).toBeNull(); resultId = result.data!.id;
    const expected = rankConcepts([{ preferences, tonight: answers }, { preferences, tonight: answers }], { minutes: 270, max_travel_minutes: 15, budget_level: 1, environment: "either", transport: "walk" });
    expect((result.data!.recommendations as { concept_id: string }[]).map(c => c.concept_id)).toEqual(expected.map(c => c.id));
    expect(expected).toHaveLength(4);
    expect((await clients[1].rpc("calculate_couple_match", { p_session: session })).data).toEqual(calculated.data);
    expect((await clients[0].from("match_results").select("*").eq("session_id", session)).data).toHaveLength(1);
    const dbCatalog = await clients[0].from("activity_concepts").select("*"); expect(dbCatalog.data).toHaveLength(catalog.length);
    for (const concept of catalog) { const db = dbCatalog.data!.find(c => c.id === concept.id)!; expect(db).toMatchObject({ duration_minutes: concept.duration, energy: concept.energy, cost_level: concept.cost, interests: concept.interests, tags: concept.tags }); }
  });
  it("keeps notes, ratings, personal memories and scores out of shared payloads", async () => {
    const progress = await clients[1].rpc("tonight_progress", { p_session: session }); const results = await clients[1].from("match_results").select("*");
    const shared = JSON.stringify([progress.data, results.data]);
    expect(shared).not.toContain("LOCAL_ONLY_PRIVATE"); expect(shared).not.toContain('"ratings"'); expect(shared).not.toContain('"score"');
    expect((await clients[1].from("user_preferences").select("*")).data).toHaveLength(1);
    expect((await clients[1].from("tonight_responses").select("*").eq("user_id", ids[0])).data).toEqual([]);
  });
  it("reveals only submitted Tonight answers on explicit consent and supports revocation", async () => {
    await submit(0, answers, true);
    const revealed = await clients[1].rpc("tonight_progress", { p_session: session }); expect(JSON.stringify(revealed.data)).toContain("LOCAL_ONLY_PRIVATE_NOTE"); expect(JSON.stringify(revealed.data)).not.toContain("LOCAL_ONLY_PRIVATE_MEMORY");
    await submit(0, answers, false);
    expect(JSON.stringify((await clients[1].rpc("tonight_progress", { p_session: session })).data)).not.toContain("LOCAL_ONLY_PRIVATE_NOTE");
  });
  it("saves a selected concept, then invalidates both submissions after shared edits", async () => {
    await clients[0].rpc("calculate_couple_match", { p_session: session });
    const result = (await clients[0].from("match_results").select("*").eq("stale", false).single()).data!;
    const top = (result.recommendations as { concept_id: string }[])[0].concept_id;
    expect((await clients[1].rpc("select_match_concept", { p_session: session, p_result: result.id, p_concept: top })).error).toBeNull();
    expect((await clients[0].from("activity_sessions").select("selected_concept_id").eq("id", session).single()).data?.selected_concept_id).toBe(top);
    const updated = await clients[1].rpc("update_tonight_context", { p_session: session, p_context: { ...context, end_time: "02:00" }, p_expected_revision: revision }); expect(updated.error).toBeNull(); revision = updated.data!;
    expect((await clients[0].rpc("update_tonight_context", { p_session: session, p_context: context, p_expected_revision: revision - 1 })).error?.message).toBe("edit_conflict");
    expect((await clients[0].rpc("calculate_couple_match", { p_session: session })).data).toEqual({ state: "waiting" });
    const row = await clients[0].from("activity_sessions").select("*").eq("id", session).single(); expect(row.data?.ends_next_day).toBe(true); expect(row.data?.selected_concept_id).toBeNull();
    expect(JSON.stringify((await clients[0].rpc("tonight_progress", { p_session: session })).data)).not.toContain('"ready":true');
    expect((await clients[0].rpc("select_match_concept", { p_session: session, p_result: resultId, p_concept: top })).error?.message).toBe("stale_match");
  });
  it("rechecks exclusions and supports a private-feedback reroll", async () => {
    await submit(0); await submit(1); expect((await clients[0].rpc("calculate_couple_match", { p_session: session })).error).toBeNull();
    const first = (await clients[0].from("match_results").select("*").eq("stale", false).single()).data!;
    const top = (first.recommendations as { concept_id: string }[])[0].concept_id;
    expect((await clients[0].rpc("record_match_feedback", { p_session: session, p_concept: top, p_reason: "not_interested" })).error).toBeNull();
    expect((await clients[1].from("match_feedback").select("*")).data).toEqual([]);
    expect((await clients[1].rpc("calculate_couple_match", { p_session: session })).error).toBeNull();
    const next = (await clients[1].from("match_results").select("*").eq("stale", false).single()).data!;
    expect((next.recommendations as { concept_id: string }[]).some(c => c.concept_id === top)).toBe(false);
    expect((next.recommendations as { concept_id: string }[]).every(c => !catalog.find(x => x.id === c.concept_id)!.tags.includes("walking"))).toBe(true);
  });
  it("never relaxes strict exclusions when no concept is feasible", async () => {
    await submit(0, { ...answers, avoid_interests: [...interests] });
    const calculated = await clients[0].rpc("calculate_couple_match", { p_session: session });
    expect(calculated.error).toBeNull(); expect(calculated.data).toMatchObject({ state: "no_match" });
    const latest = await clients[0].from("match_results").select("recommendations").eq("stale", false).single(); expect(latest.data?.recommendations).toEqual([]);
  });
  it("invalidates readiness after profile edits and keeps diverse SQL/TypeScript ranking in parity", async () => {
    const a = personalSchema.parse({ ratings: Object.fromEntries(interests.map((k, i) => [k, i % 5 + 1])), energy: 1, pace: 1, novelty: 5, social: "private" });
    const b = personalSchema.parse({ ratings: Object.fromEntries(interests.map((k, i) => [k, 5 - i % 5])), pace: 5, novelty: 1, social: "open", excluded_interests: ["sport"] });
    for (const [n, value] of [a, b].entries()) {
      const row = await clients[n].from("user_preferences").select("version").single();
      expect((await clients[n].rpc("save_personal_preferences", { p_answers: value, p_step: 28, p_expected_version: row.data!.version, p_complete: true })).error).toBeNull();
    }
    expect((await clients[0].rpc("calculate_couple_match", { p_session: session })).data).toEqual({ state: "waiting" });
    const updated = await clients[0].rpc("update_tonight_context", { p_session: session, p_context: { ...context, transport: "car" }, p_expected_revision: revision }); expect(updated.error).toBeNull(); revision = updated.data!;
    await submit(0); await submit(1);
    expect((await clients[1].rpc("calculate_couple_match", { p_session: session })).error).toBeNull();
    const latest = await clients[0].from("match_results").select("recommendations").eq("stale", false).single();
    const expected = rankConcepts([{ preferences: a, tonight: answers }, { preferences: b, tonight: answers }], { minutes: 270, max_travel_minutes: 15, budget_level: 1, environment: "either", transport: "car" });
    expect((latest.data!.recommendations as { concept_id: string }[]).map(c => c.concept_id)).toEqual(expected.map(c => c.id));
  });
});
