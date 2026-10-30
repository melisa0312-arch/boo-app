import { interests, interestLabels, restrictionTags, restrictionLabels, type Label } from "./model";
export type Option = { value: string; label: Label };
export type Question = { key: string; title: Label; kind: "rating" | "choice" | "multi" | "text"; options?: Option[]; optional?: boolean; low?: Label; high?: Label };
const choices = (values: [string, string, string][]): Option[] => values.map(([value, bg, en]) => ({ value, label: { bg, en } }));
export const interestOptions = interests.map(value => ({ value, label: interestLabels[value] }));
export const restrictionOptions = restrictionTags.map(value => ({ value, label: restrictionLabels[value] }));
const scale = (key: string, bg: string, en: string, lowBg: string, lowEn: string, highBg: string, highEn: string): Question => ({ key, kind: "rating", optional: true, title: { bg, en }, low: { bg: lowBg, en: lowEn }, high: { bg: highBg, en: highEn } });
export const personalQuestions: Question[] = [
  ...interests.map(key => ({ key: `ratings.${key}`, title: interestLabels[key], kind: "rating" as const, low: { bg: "Не е моето нещо", en: "Not my thing" }, high: { bg: "Много ми харесва", en: "Love it" } })),
  scale("novelty", "Колко ти се опитва нещо ново?", "How keen are you to try something new?", "Предпочитам познатото", "Prefer familiar", "Обичам новото", "Love the new"),
  { key: "social", kind: "choice", optional: true, title: { bg: "В каква компания ти е най-добре?", en: "What company feels right?" }, options: choices([["private", "Само двамата", "Just us"], ["small_group", "Малка компания", "A small group"], ["open", "Отворено към хора", "Open to people"]]) },
  scale("spontaneity", "Спонтанно или с план?", "Spontaneous or planned?", "С ясен план", "A clear plan", "Да видим накъде", "See where it goes"),
  scale("energy", "Твоето обичайно ниво на енергия", "Your usual energy level", "Тихо и леко", "Quiet and gentle", "С много енергия", "Full of energy"),
  scale("pace", "В какъв ритъм обичаш да си?", "What pace feels like you?", "Бавно и спокойно", "Slow and easy", "Бързо и активно", "Fast and active"),
  { key: "limitation_tags", kind: "multi", optional: true, title: { bg: "Кои ограничения да спазваме винаги?", en: "Which limits should we always respect?" }, options: restrictionOptions },
  { key: "excluded_interests", kind: "multi", optional: true, title: { bg: "Кои категории да изключим?", en: "Which categories should we exclude?" }, options: interestOptions },
  { key: "favorite_experiences", kind: "text", optional: true, title: { bg: "Един любим преживян момент?", en: "A favourite past experience?" } },
  { key: "disliked_activities", kind: "text", optional: true, title: { bg: "Какво не ти допада и защо?", en: "What don’t you enjoy, and why?" } },
  { key: "dream_experiences", kind: "text", optional: true, title: { bg: "Какво преживяване си мечтаеш да имаш?", en: "What experience do you dream of?" } },
  { key: "romantic_preferences", kind: "multi", optional: true, title: { bg: "Как изглежда романтиката за теб?", en: "What does romance look like to you?" }, options: choices([["quiet", "Тиха близост", "Quiet connection"], ["playful", "Закачливо", "Playful"], ["creative", "Творческо", "Creative"], ["thoughtful", "Внимателни жестове", "Thoughtful gestures"], ["adventurous", "Приключение", "Adventure"], ["surprise", "Изненада", "A surprise"]]) },
  { key: "location_characteristics", kind: "multi", optional: true, title: { bg: "Какви места те привличат?", en: "What kinds of places draw you in?" }, options: choices([["nature", "Природа", "Nature"], ["city", "Град", "City"], ["quiet", "Тишина", "Quiet"], ["views", "Гледки", "Views"], ["cozy", "Уют", "Cozy"], ["indoors", "На закрито", "Indoors"], ["outdoors", "Навън", "Outdoors"]]) },
  { key: "surprise_types", kind: "multi", optional: true, title: { bg: "Кои изненади са твои?", en: "What kinds of surprises feel like you?" }, options: choices([["small", "Малък жест", "A small gesture"], ["planned", "С подсказка", "With a heads-up"], ["creative", "Творческа", "Creative"], ["experience", "Преживяване", "An experience"], ["none", "Предпочитам без изненади", "Prefer no surprises"]]) },
  { key: "automotive_interests", kind: "multi", optional: true, title: { bg: "Какво ти е интересно в автомобилите?", en: "What interests you about cars?" }, options: choices([["design", "Дизайн", "Design"], ["classics", "Класики", "Classics"], ["motorsport", "Моторни спортове", "Motorsport"], ["roadtrip", "Пътешествия", "Road trips"], ["technology", "Технологии", "Technology"]]) },
  { key: "game_types", kind: "multi", optional: true, title: { bg: "Как обичаш да играеш?", en: "How do you like to play?" }, options: choices([["board", "Настолни", "Board games"], ["cooperative", "Кооперативно", "Cooperatively"], ["competitive", "Състезателно", "Competitively"], ["arcade", "Аркади", "Arcades"], ["vr", "VR", "VR"], ["puzzle", "Загадки", "Puzzles"]]) },
  scale("unfamiliar_comfort", "Колко комфортно ти е с непознати занимания?", "How comfortable are unfamiliar activities?", "С малки стъпки", "Small steps", "С любопитство", "With curiosity"),
];
export const tonightQuestions: Question[] = [
  { key: "mood", kind: "choice", title: { bg: "Какво е настроението ти сега?", en: "What’s your mood right now?" }, options: choices([["curious", "Любопитно", "Curious"], ["calm", "Спокойно", "Calm"], ["playful", "Игриво", "Playful"], ["romantic", "Романтично", "Romantic"], ["adventurous", "Приключенско", "Adventurous"]]) },
  { ...scale("energy", "Колко енергия имаш тази вечер?", "How much energy do you have tonight?", "Имам нужда от пауза", "Need a pause", "Готовност за всичко", "Ready for anything"), optional: false },
  { key: "desired_interests", kind: "multi", title: { bg: "За какво ти се намира време?", en: "What would you make time for?" }, options: interestOptions },
  { key: "avoid_interests", kind: "multi", optional: true, title: { bg: "Какво пропускаме тази вечер?", en: "What are we skipping tonight?" }, options: interestOptions },
  { key: "restriction_tags", kind: "multi", optional: true, title: { bg: "Има ли временни ограничения?", en: "Any temporary restrictions?" }, options: restrictionOptions },
  { key: "intention", kind: "choice", optional: true, title: { bg: "От какво имаш нужда?", en: "What do you need?" }, options: choices([["connect", "Близост", "Connection"], ["explore", "Откриване", "Exploration"], ["unwind", "Разпускане", "Unwinding"], ["play", "Игра", "Play"], ["move", "Движение", "Movement"]]) },
  scale("pace", "Спокойно или активно?", "Relaxed or active?", "Спокойно", "Relaxed", "Активно", "Active"),
  scale("familiarity", "Познато или ново?", "Familiar or new?", "Познато усещане", "Familiar feel", "Нещо различно", "Something different"),
  scale("social", "Само двамата или сред хора?", "Just us or around people?", "Само ние", "Just us", "Сред хора", "Around people"),
  { key: "notes", kind: "text", optional: true, title: { bg: "Нещо лично, което да запазиш?", en: "A private note to keep?" } },
];
export const readAnswer = (answers: Record<string, unknown>, key: string): unknown => key.startsWith("ratings.") ? (answers.ratings as Record<string, number> | undefined)?.[key.split(".")[1]] : answers[key];
export function withAnswer<T extends Record<string, unknown>>(answers: T, key: string, value: unknown): T {
  if (key.startsWith("ratings.")) return { ...answers, ratings: { ...(answers.ratings as Record<string, unknown>), [key.split(".")[1]]: value } };
  const result = { ...answers };
  if (value === undefined) delete result[key]; else Object.assign(result, { [key]: value });
  return result;
}
