import type { Interest, Label } from "../personalization/model";
export type Concept = {
  id: string; title: Label; description: Label; interests: Interest[]; duration: number; cost: number;
  energy: number; pace: number; novelty: number; social: number; environment: "indoor" | "outdoor" | "either";
  tags: string[]; transport: "car" | null;
};
type Definition = [string, string, string, Interest[], number, number, number, number, number, number, Concept["environment"], string[], Concept["transport"]?];
const definitions: Definition[] = [
  ["dream-car", "Дизайн на мечтания автомобил", "Design a dream car", ["cars", "creative"], 45, 0, 1, 1, 3, 1, "indoor", ["fine_motor"]],
  ["car-stories", "Истории на четири колела", "Stories on four wheels", ["cars", "culture"], 30, 0, 1, 1, 2, 1, "either", []],
  ["scenic-drive", "Идея за живописно пътуване", "A scenic-drive concept", ["cars", "travel", "nature"], 60, 1, 2, 2, 3, 1, "outdoor", ["driving"], "car"],
  ["draw-together", "Две гледни точки, една рисунка", "Two perspectives, one drawing", ["creative", "romance"], 45, 0, 1, 1, 3, 1, "indoor", ["fine_motor"]],
  ["creative-prompts", "Творчески предизвикателства", "Creative prompt exchange", ["creative", "games"], 30, 0, 1, 2, 4, 1, "either", ["fine_motor"]],
  ["cooperative-puzzle", "Кооперативна загадка", "A cooperative puzzle", ["games", "creative"], 45, 0, 1, 2, 3, 1, "indoor", []],
  ["game-duel", "Приятелски игрови дуел", "A friendly game duel", ["games"], 45, 1, 2, 3, 2, 2, "indoor", []],
  ["vr-concept", "Идея за VR преживяване", "A VR experience concept", ["games", "adventure"], 45, 2, 3, 3, 5, 2, "indoor", ["screens", "standing"]],
  ["bowling-concept", "Идея за боулинг", "A bowling concept", ["games", "sport"], 60, 2, 3, 3, 2, 3, "indoor", ["walking", "standing", "loud"]],
  ["neighbourhood", "Непознатото в познатия квартал", "The unfamiliar in your neighbourhood", ["travel", "culture"], 45, 0, 2, 2, 4, 1, "outdoor", ["walking"]],
  ["travel-dreaming", "Следващото място на картата", "Your next place on the map", ["travel", "romance"], 30, 0, 1, 1, 4, 1, "indoor", []],
  ["view-pause", "Пауза за гледки", "A pause for a view", ["nature", "relax"], 30, 0, 1, 1, 2, 1, "outdoor", []],
  ["nature-observation", "Малко наблюдение на природата", "A little nature observation", ["nature", "photography"], 45, 0, 2, 1, 3, 1, "outdoor", ["walking"]],
  ["gentle-movement", "Движение в общ ритъм", "Movement at a shared pace", ["sport", "relax"], 30, 0, 2, 2, 2, 1, "either", ["standing"]],
  ["active-challenge", "Малко спортно предизвикателство", "A small active challenge", ["sport", "adventure"], 45, 0, 4, 4, 3, 2, "outdoor", ["intense", "standing"]],
  ["flavour-ideas", "Меню за мечтаната вечер", "Design your dream evening menu", ["food", "creative"], 30, 0, 1, 1, 3, 1, "indoor", []],
  ["culinary-concept", "Кулинарно преживяване за двама", "A culinary experience concept", ["food", "romance"], 60, 2, 2, 2, 3, 1, "indoor", ["standing", "fine_motor"]],
  ["culture-concept", "Културна тема за двама", "A cultural theme for two", ["culture", "travel"], 60, 1, 2, 2, 4, 2, "indoor", ["walking", "crowds"]],
  ["story-exchange", "Истории, които още не знаете", "Stories you haven’t heard yet", ["culture", "romance", "relax"], 30, 0, 1, 1, 2, 1, "either", []],
  ["photo-story", "Вашата фотоистория", "Your photo story", ["photography", "travel"], 45, 0, 2, 2, 4, 1, "outdoor", ["walking", "fine_motor"]],
  ["photo-details", "Красота в малките детайли", "Beauty in little details", ["photography", "creative"], 30, 0, 1, 1, 3, 1, "either", ["fine_motor"]],
  ["connection-questions", "Въпроси само за нас", "Questions just for us", ["romance", "relax"], 30, 0, 1, 1, 2, 1, "either", []],
  ["micro-adventure", "Микроприключение с тема", "A themed micro-adventure", ["adventure", "nature", "travel"], 60, 1, 3, 3, 5, 1, "outdoor", ["walking", "standing"]],
  ["quiet-ritual", "Малък ритуал за спокойствие", "A little calming ritual", ["relax", "romance"], 20, 0, 1, 1, 1, 1, "indoor", []],
];
export const catalog: Concept[] = definitions.map(([id, bg, en, interests, duration, cost, energy, pace, novelty, social, environment, tags, transport]) => ({
  id, title: { bg, en }, description: {
    bg: "Идея от вътрешния каталог на BŪ. Изберете реално място и проверете достъпност, разходи и условия преди план.",
    en: "A concept from BŪ’s internal catalog. Choose a real setting and check access, costs, and conditions before planning.",
  }, interests, duration, cost, energy, pace, novelty, social, environment, tags, transport: transport ?? null,
}));
export const catalogVersion = "concepts-1";
