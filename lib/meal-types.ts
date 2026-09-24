// Meal shapes and nutrition maths shared by server pages and the browser (no server-only imports).

export const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABELS: Record<Slot, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };
export const ZERO: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

export const add = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
});
export const scale = (m: Macros, k: number): Macros => ({ kcal: m.kcal * k, protein: m.protein * k, carbs: m.carbs * k, fat: m.fat * k });

/** Nutrition per 100 g. */
export type Food = Macros & {
  id: string;
  name: string;
  brand: string | null;
  off_code: string | null;
  serving_g: number | null;
};

/** A food not saved yet (e.g. an Open Food Facts search result). */
export type FoodDraft = Omit<Food, "id"> & { id?: string };

export type MealItem = { food: Food; grams: number };

export type Meal = {
  id: string;
  name: string;
  slots: Slot[];
  servings: number; // portions the recipe makes
  extra: Macros; // typed totals per serving
  notes: string | null;
  items: MealItem[];
};

export type PlanEntry = {
  id: string;
  day: string;
  slot: Slot;
  mealId: string;
  servings: number; // cooked (shopping)
  myServings: number; // counted to your macros
};

export type Targets = { training: Macros | null; rest: Macros | null };
export type DayKind = "training" | "rest";

export function itemMacros(item: { food: Macros; grams: number }): Macros {
  return scale(item.food, item.grams / 100);
}

/** Macros for one serving of a meal. */
export function perServing(meal: { servings: number; extra: Macros; items: { food: Macros; grams: number }[] }): Macros {
  const fromItems = meal.items.reduce((sum, i) => add(sum, itemMacros(i)), ZERO);
  return add(scale(fromItems, 1 / meal.servings), meal.extra);
}

export function round(m: Macros): Macros {
  return { kcal: Math.round(m.kcal), protein: Math.round(m.protein), carbs: Math.round(m.carbs), fat: Math.round(m.fat) };
}

export const macroLine = (m: Macros) => {
  const r = round(m);
  return `${r.kcal.toLocaleString("en-AU")} kcal · P ${r.protein}g · C ${r.carbs}g · F ${r.fat}g`;
};

export const SUPPLEMENT_TIMES = [
  { key: "morning", label: "Morning" },
  { key: "pre_workout", label: "Pre-workout" },
  { key: "post_workout", label: "Post-workout" },
  { key: "with_meals", label: "With meals" },
  { key: "night", label: "Night" },
] as const;

export type Supplement = { id: string; name: string; dose: string | null; time: string; position: number; active: boolean };
