import type { PersonalAnswers, TonightAnswers } from "../personalization/model";
import { catalog, type Concept } from "./catalog";
export type MatchPerson = { preferences: PersonalAnswers; tonight: TonightAnswers };
export type MatchContext = { minutes: number; max_travel_minutes: number; budget_level: number; environment: string; transport: string };
const overlaps = (a: readonly string[], b: readonly string[]) => a.some(v => b.includes(v));
export function eligible(concept: Concept, people: [MatchPerson, MatchPerson], context: MatchContext) {
  if (concept.duration + context.max_travel_minutes * 2 > context.minutes || concept.cost > context.budget_level) return false;
  if (context.environment !== "either" && concept.environment !== "either" && concept.environment !== context.environment) return false;
  if (concept.transport && concept.transport !== context.transport) return false;
  return people.every(({ preferences: p, tonight: t }) =>
    concept.energy <= (t.energy ?? p.energy ?? 3) && !overlaps(concept.interests, [...(p.excluded_interests ?? []), ...(t.avoid_interests ?? [])]) &&
    !overlaps(concept.tags, [...(p.limitation_tags ?? []), ...(t.restriction_tags ?? [])]));
}
export function personScore(c: Concept, { preferences: p, tonight: t }: MatchPerson) {
  const interestScore = c.interests.reduce((sum, key) => sum + (p.ratings[key] ?? 3), 0) / c.interests.length * 12;
  const moodInterest: Record<string, string[]> = { curious: ["travel", "culture", "photography"], calm: ["relax", "nature"], playful: ["games", "creative"], romantic: ["romance", "food"], adventurous: ["adventure", "sport", "cars"] };
  return interestScore + (overlaps(c.interests, t.desired_interests ?? []) ? 15 : 0) + (overlaps(c.interests, moodInterest[t.mood ?? ""] ?? []) ? 8 : 0) +
    (10 - Math.abs((t.energy ?? 3) - c.energy) * 2) + (10 - Math.abs((t.pace ?? p.pace ?? 3) - c.pace) * 2) +
    (10 - Math.abs((t.familiarity ?? p.novelty ?? 3) - c.novelty) * 2) + (10 - Math.abs((t.social ?? (p.social === "private" ? 1 : p.social === "open" ? 5 : 3)) - c.social) * 2);
}
/** Reference kernel. PostgreSQL executes the same formula without releasing private inputs; parity is integration-tested. */
export function rankConcepts(people: [MatchPerson, MatchPerson], context: MatchContext, vetoes: string[] = [], concepts = catalog) {
  return concepts.filter(c => !vetoes.includes(c.id) && eligible(c, people, context)).map(c => {
    const a = personScore(c, people[0]), b = personScore(c, people[1]);
    return { id: c.id, score: .75 * Math.min(a, b) + .25 * ((a + b) / 2) - .05 * Math.abs(a - b) };
  }).sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, 4);
}
