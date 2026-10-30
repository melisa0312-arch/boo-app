import { describe, expect, it } from "vitest";
import { interests, personalSchema, tonightSchema, suggestions } from "@/features/personalization/model";
import { personalQuestions, tonightQuestions } from "@/features/personalization/questions";
import { catalog } from "@/features/match/catalog";
import { eligible, personScore, rankConcepts, type MatchPerson } from "@/features/match/engine";
const preferences = personalSchema.parse({ ratings: Object.fromEntries(interests.map(k => [k, 3])) });
const person: MatchPerson = { preferences, tonight: { mood: "curious", energy: 3, desired_interests: ["creative"] } };
const context = { minutes: 180, max_travel_minutes: 15, budget_level: 1, environment: "either", transport: "walk" };
describe("deterministic fair match kernel", () => {
  it("is deterministic and partner-order independent", () => {
    const other = { ...person, tonight: { ...person.tonight, desired_interests: ["nature" as const] } };
    expect(rankConcepts([person, other], context)).toEqual(rankConcepts([other, person], context));
    expect(rankConcepts([person, other], context)).toEqual(rankConcepts([person, other], context));
  });
  it("returns a top match and three distinct alternatives", () => {
    const result = rankConcepts([person, person], context); expect(result).toHaveLength(4); expect(new Set(result.map(r => r.id)).size).toBe(4);
  });
  it("does not substitute unfit suggestions for an empty feasible set", () => expect(rankConcepts([person, person], { ...context, minutes: 10 })).toEqual([]));
  it("applies explicit category exclusions before scoring", () => {
    const excluded = { ...person, preferences: { ...preferences, excluded_interests: [...interests] } };
    expect(rankConcepts([excluded, person], context)).toEqual([]);
  });
  it("respects either person's temporary and permanent physical limits", () => {
    const constrained = { ...person, tonight: { ...person.tonight, restriction_tags: ["walking" as const, "fine_motor" as const] } };
    const result = rankConcepts([person, constrained], context);
    expect(result.every(r => !catalog.find(c => c.id === r.id)!.tags.some(t => ["walking", "fine_motor"].includes(t)))).toBe(true);
  });
  it("reserves both travel legs even when the date crosses midnight", () => {
    const c = catalog.find(c => c.id === "draw-together")!;
    expect(eligible(c, [person, person], { ...context, minutes: 60, max_travel_minutes: 10 })).toBe(false);
    expect(eligible(c, [person, person], { ...context, minutes: 65, max_travel_minutes: 10 })).toBe(true);
  });
  it("filters budget, environment, transportation and energy", () => {
    expect(eligible(catalog.find(c => c.id === "vr-concept")!, [person, person], context)).toBe(false);
    expect(eligible(catalog.find(c => c.id === "scenic-drive")!, [person, person], context)).toBe(false);
    expect(eligible(catalog.find(c => c.id === "view-pause")!, [person, person], { ...context, environment: "indoor" })).toBe(false);
    expect(eligible(catalog.find(c => c.id === "active-challenge")!, [person, person], { ...context, budget_level: 3 })).toBe(false);
  });
  it("uses tonight's explicit energy instead of overwriting it with a profile default", () => {
    const p = { ...person, preferences: { ...preferences, energy: 1 } };
    expect(eligible(catalog.find(c => c.id === "nature-observation")!, [p, person], context)).toBe(true);
  });
  it("favors balanced satisfaction over one person's maximum", () => {
    const a = { preferences: { ...preferences, ratings: { ...preferences.ratings, cars: 5, creative: 3 } }, tonight: { energy: 3, mood: "calm" as const } };
    const b = { preferences: { ...preferences, ratings: { ...preferences.ratings, cars: 1, creative: 3 } }, tonight: { energy: 3, mood: "calm" as const } };
    const car = { ...catalog[0], id: "car", interests: ["cars" as const] }, balanced = { ...car, id: "balanced", interests: ["creative" as const] };
    expect(personScore(car, a)).toBeGreaterThan(personScore(balanced, a));
    expect(rankConcepts([a, b], context, [], [car, balanced])[0].id).toBe("balanced");
  });
  it("rerolls deterministically using private feedback vetoes", () => {
    const first = rankConcepts([person, person], context)[0].id;
    const reroll = rankConcepts([person, person], context, [first]); expect(reroll).toHaveLength(4); expect(reroll.some(r => r.id === first)).toBe(false);
  });
});
describe("private questionnaires", () => {
  it("bounds ratings and rejects extra keys and duplicate selections", () => {
    expect(personalSchema.safeParse({ ratings: { cars: 6 } }).success).toBe(false);
    expect(personalSchema.safeParse({ ratings: {}, is_admin: true }).success).toBe(false);
    expect(tonightSchema.safeParse({ desired_interests: ["cars", "cars"] }).success).toBe(false);
  });
  it("allows optional questions to stay absent", () => expect(personalSchema.parse({ ratings: {} })).toEqual({ ratings: {} }));
  it("has complete Bulgarian/English labels and one rating question per interest", () => {
    expect(personalQuestions.filter(q => q.key.startsWith("ratings."))).toHaveLength(12);
    for (const q of [...personalQuestions, ...tonightQuestions]) { expect(q.title.bg).toBeTruthy(); expect(q.title.en).toBeTruthy(); }
  });
  it("creates suggestions as a new value without mutating personal preferences", () => {
    const before = JSON.stringify(preferences); const value = suggestions(preferences); value.desired_interests!.push("cars"); expect(JSON.stringify(preferences)).toBe(before);
  });
});
