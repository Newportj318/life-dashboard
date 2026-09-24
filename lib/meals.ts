import "server-only";
import {
  add,
  perServing,
  scale,
  ZERO,
  type DayKind,
  type Food,
  type Macros,
  type Meal,
  type PlanEntry,
  type Slot,
  type Supplement,
  type Targets,
} from "@/lib/meal-types";
import { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

const num = (v: unknown) => Number(v ?? 0);

function toFood(r: Record<string, unknown>): Food {
  return {
    id: r.id as string,
    name: r.name as string,
    brand: (r.brand as string) ?? null,
    off_code: (r.off_code as string) ?? null,
    serving_g: r.serving_g == null ? null : num(r.serving_g),
    kcal: num(r.kcal),
    protein: num(r.protein),
    carbs: num(r.carbs),
    fat: num(r.fat),
  };
}

/** Every meal with its ingredients, alphabetical. */
export async function loadLibrary(supabase: Supabase): Promise<Meal[]> {
  const [meals, items] = await Promise.all([
    supabase.from("meals").select("*").order("name"),
    supabase.from("meal_items").select("meal_id, grams, position, foods(*)").order("position"),
  ]);
  const itemRows = check(items) as unknown as { meal_id: string; grams: number; foods: Record<string, unknown> }[];

  return (check(meals) as Record<string, unknown>[]).map((m) => ({
    id: m.id as string,
    name: m.name as string,
    slots: (m.slots as Slot[]) ?? [],
    servings: num(m.servings) || 1,
    extra: { kcal: num(m.extra_kcal), protein: num(m.extra_protein), carbs: num(m.extra_carbs), fat: num(m.extra_fat) },
    notes: (m.notes as string) ?? null,
    items: itemRows.filter((i) => i.meal_id === m.id).map((i) => ({ food: toFood(i.foods), grams: num(i.grams) })),
  }));
}

export async function loadPlan(supabase: Supabase, fromDay: string, toDay: string): Promise<PlanEntry[]> {
  const rows = check(
    await supabase.from("meal_plan").select("*").gte("day", fromDay).lte("day", toDay).order("created_at")
  ) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    day: r.day as string,
    slot: r.slot as Slot,
    mealId: r.meal_id as string,
    servings: num(r.servings),
    myServings: num(r.my_servings),
  }));
}

export async function loadTargets(supabase: Supabase): Promise<Targets> {
  const rows = check(await supabase.from("nutrition_targets").select("*")) as Record<string, unknown>[];
  const pick = (kind: DayKind) => {
    const r = rows.find((x) => x.kind === kind);
    return r ? { kcal: num(r.kcal), protein: num(r.protein), carbs: num(r.carbs), fat: num(r.fat) } : null;
  };
  return { training: pick("training"), rest: pick("rest") };
}

/** Training day if the Training plan has a routine or cardio that day; otherwise a rest day. */
export async function loadDayKinds(supabase: Supabase, days: string[]) {
  const { data } = await supabase
    .from("training_plan")
    .select("day, kind, label")
    .gte("day", days[0])
    .lte("day", days.at(-1)!);
  const byDay = new Map((data ?? []).map((r) => [r.day as string, r]));
  return Object.fromEntries(
    days.map((d) => {
      const p = byDay.get(d);
      const training = p && p.kind !== "rest";
      return [d, { kind: (training ? "training" : "rest") as DayKind, session: training ? (p!.label as string) : null }];
    })
  ) as Record<string, { kind: DayKind; session: string | null }>;
}

/** Your macros for a day: each planned meal's per-serving macros × your servings. */
export function dayTotals(entries: PlanEntry[], meals: Map<string, Meal>): Macros {
  return entries.reduce((sum, e) => {
    const meal = meals.get(e.mealId);
    return meal ? add(sum, scale(perServing(meal), e.myServings)) : sum;
  }, ZERO);
}

export type ShoppingItem = { food: Food; grams: number; meals: string[] };

/**
 * Ingredients needed for the planned entries. A recipe that makes 4 servings, cooked
 * for 2, needs half its ingredients. Meals with only typed totals have nothing to buy.
 */
export function shoppingList(entries: PlanEntry[], meals: Map<string, Meal>) {
  const byFood = new Map<string, ShoppingItem>();
  const noIngredients = new Set<string>();
  for (const e of entries) {
    const meal = meals.get(e.mealId);
    if (!meal) continue;
    if (!meal.items.length) noIngredients.add(meal.name);
    for (const item of meal.items) {
      const grams = (item.grams * e.servings) / meal.servings;
      const row = byFood.get(item.food.id) ?? { food: item.food, grams: 0, meals: [] };
      row.grams += grams;
      if (!row.meals.includes(meal.name)) row.meals.push(meal.name);
      byFood.set(item.food.id, row);
    }
  }
  const items = [...byFood.values()].sort((a, b) => a.food.name.localeCompare(b.food.name));
  return { items, noIngredients: [...noIngredients].sort() };
}

export async function loadShoppingState(supabase: Supabase, weekStart: string) {
  const rows = check(
    await supabase.from("shopping_state").select("food_id, status").eq("week_start", weekStart)
  ) as { food_id: string; status: "have" | "bought" }[];
  return Object.fromEntries(rows.map((r) => [r.food_id, r.status])) as Record<string, "have" | "bought">;
}

export async function loadSupplements(supabase: Supabase, day: string) {
  const [list, log] = await Promise.all([
    supabase.from("supplements").select("*").order("position").order("name"),
    supabase.from("supplement_log").select("supplement_id").eq("day", day),
  ]);
  const supplements: Supplement[] = (check(list) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    dose: (r.dose as string) ?? null,
    time: r.time_of_day as string,
    position: num(r.position),
    active: Boolean(r.active),
  }));
  const taken = new Set((check(log) as { supplement_id: string }[]).map((r) => r.supplement_id));
  return { supplements, taken: [...taken] };
}

