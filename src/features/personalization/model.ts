import { z } from "zod";

export const interests = ["cars", "creative", "games", "travel", "nature", "sport", "food", "culture", "photography", "romance", "adventure", "relax"] as const;
export const restrictionTags = ["walking", "standing", "intense", "heights", "water", "crowds", "loud", "driving", "screens", "fine_motor", "alcohol"] as const;
export type Interest = typeof interests[number];
export type Label = { bg: string; en: string };
export const interestLabels: Record<Interest, Label> = {
  cars: { bg: "Автомобили и авто култура", en: "Cars & automotive culture" },
  creative: { bg: "Рисуване и творчество", en: "Drawing & creativity" },
  games: { bg: "Игри, VR и аркади", en: "Games, VR & arcades" },
  travel: { bg: "Пътувания и нови места", en: "Travel & exploration" },
  nature: { bg: "Природа и гледки", en: "Nature & scenic views" },
  sport: { bg: "Спорт и движение", en: "Sport & movement" },
  food: { bg: "Храна и кулинария", en: "Food & culinary experiences" },
  culture: { bg: "Музеи, култура и събития", en: "Museums, culture & events" },
  photography: { bg: "Фотография", en: "Photography" },
  romance: { bg: "Романтични преживявания", en: "Romantic experiences" },
  adventure: { bg: "Адреналин и приключения", en: "Adrenaline & adventure" },
  relax: { bg: "Спокойни занимания", en: "Relaxing activities" },
};
export const restrictionLabels: Record<typeof restrictionTags[number], Label> = {
  walking: { bg: "Без продължително ходене", en: "No prolonged walking" }, standing: { bg: "Без стоене прав", en: "No prolonged standing" },
  intense: { bg: "Без силно натоварване", en: "No intense exertion" }, heights: { bg: "Без височини", en: "No heights" },
  water: { bg: "Без водни занимания", en: "No water activities" }, crowds: { bg: "Без тълпи", en: "No crowds" },
  loud: { bg: "Без силен шум", en: "No loud environments" }, driving: { bg: "Без шофиране", en: "No driving" },
  screens: { bg: "Без екрани / VR", en: "No screens / VR" }, fine_motor: { bg: "Без фини движения с ръце", en: "No fine hand movements" },
  alcohol: { bg: "Без алкохол", en: "No alcohol" },
};
const rating = z.number().int().min(1).max(5);
const list = <T extends readonly [string, ...string[]]>(values: T) => z.array(z.enum(values)).max(values.length).refine(a => new Set(a).size === a.length);
export const personalSchema = z.object({
  ratings: z.partialRecord(z.enum(interests), rating).default({}),
  novelty: rating.optional(), social: z.enum(["private", "small_group", "open"]).optional(),
  spontaneity: rating.optional(), energy: rating.optional(), pace: rating.optional(),
  excluded_interests: list(interests).optional(), limitation_tags: list(restrictionTags).optional(),
  favorite_experiences: z.string().trim().max(1000).optional(), disliked_activities: z.string().trim().max(1000).optional(), dream_experiences: z.string().trim().max(1000).optional(),
  romantic_preferences: list(["quiet", "playful", "creative", "thoughtful", "adventurous", "surprise"]).optional(),
  location_characteristics: list(["nature", "city", "quiet", "views", "cozy", "indoors", "outdoors"]).optional(),
  surprise_types: list(["small", "planned", "creative", "experience", "none"]).optional(),
  automotive_interests: list(["design", "classics", "motorsport", "roadtrip", "technology"]).optional(),
  game_types: list(["board", "cooperative", "competitive", "arcade", "vr", "puzzle"]).optional(),
  unfamiliar_comfort: rating.optional(),
}).strict();
export type PersonalAnswers = z.infer<typeof personalSchema>;
export const moods = ["curious", "calm", "playful", "romantic", "adventurous"] as const;
export const tonightSchema = z.object({
  mood: z.enum(moods).optional(), energy: rating.optional(), desired_interests: list(interests).optional(),
  avoid_interests: list(interests).optional(), restriction_tags: list(restrictionTags).optional(),
  intention: z.enum(["connect", "explore", "unwind", "play", "move"]).optional(),
  pace: rating.optional(), familiarity: rating.optional(), social: rating.optional(), notes: z.string().trim().max(1000).optional(),
}).strict();
export type TonightAnswers = z.infer<typeof tonightSchema>;
export const completePersonal = (a: PersonalAnswers) => interests.every(key => a.ratings[key] !== undefined);
export const completeTonight = (a: TonightAnswers) => Boolean(a.mood && a.energy && a.desired_interests?.length);
export function suggestions(p: PersonalAnswers): TonightAnswers {
  return { energy: p.energy ?? 3, desired_interests: [...interests].sort((a, b) => (p.ratings[b] ?? 3) - (p.ratings[a] ?? 3)).slice(0, 2),
    pace: p.pace ?? 3, familiarity: p.novelty ?? 3, social: p.social === "private" ? 1 : p.social === "open" ? 5 : 3,
    avoid_interests: [...(p.excluded_interests ?? [])], restriction_tags: [...(p.limitation_tags ?? [])] };
}
